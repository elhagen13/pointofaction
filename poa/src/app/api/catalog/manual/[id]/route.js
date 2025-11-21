import { MongoClient, ObjectId } from "mongodb";
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "reservations";
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const reservations = db.collection(COLLECTION_NAME);
    const inventory = db.collection("inventory");
    const { quantities } = await request.json();
    const { id } = await params;

    // Get the original reservation
    const original = await reservations.findOne({ _id: new ObjectId(id) });
    if (!original) {
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Original reservation:", original);
    console.log("Items to update:", quantities);

    // Only process items that are being updated (in quantities object)
    const changes = {};
    for (const [itemId, newQty] of Object.entries(quantities)) {
      // Find this item in the original reservation
      const originalItem = original.items.find((i) => i.itemId === itemId);
      const originalQty = originalItem?.quantReserved || 0;
      const pulled = originalItem?.pulled || 0;
      
      // Calculate the remaining (unpulled) quantity
      const remaining = originalQty - pulled;
      
      if (newQty !== remaining) {
        const diff = newQty - remaining;
        changes[itemId] = {
          original: remaining,
          new: newQty,
          difference: diff,
          pulled: pulled,
        };
      }
      console.log(changes[itemId]);
    }

    console.log(changes);
    console.log("Changes to apply:", changes);

    // Update inventory reserved quantities for changed items only
    for (const [itemId, change] of Object.entries(changes)) {
      await inventory.updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { reserved: change.difference } }
      );
      console.log(
        `Updated inventory ${itemId}: reserved ${change.difference > 0 ? "+" : ""}${change.difference}`
      );
    }

    // Update only the specific items in the reservation
    for (const [itemId, newQty] of Object.entries(quantities)) {
      const itemIndex = original.items.findIndex((i) => i.itemId === itemId);
      console.log("NEW QUANTITY", newQty);
      
      if (itemIndex !== -1) {
        const originalItem = original.items[itemIndex];
        const pulled = originalItem?.pulled || 0;
        // The new quantReserved should be newQty + pulled
        const newQuantReserved = newQty + pulled;
        
        await reservations.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              [`items.${itemIndex}.quantReserved`]: newQuantReserved,
              updatedAt: new Date(),
            },
          }
        );
        console.log(
          `Updated reservation item ${itemId}: quantReserved = ${newQuantReserved} (remaining: ${newQty}, pulled: ${pulled})`
        );
      } else {
        if(newQty == 0) continue
        await reservations.updateOne(
          { _id: new ObjectId(id) },
          {
            $push: {
              items: {
                itemId: itemId,
                quantReserved: newQty,
                pulled: 0,
              },
            },
            $set: {
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    // Fetch and return updated reservation
    const updatedReservation = await reservations.findOne({
      _id: new ObjectId(id),
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedReservation,
        changes: {
          itemsUpdated: Object.keys(changes).length,
          details: changes,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PATCH error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}