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
    const { itemId, returnedQuantity } = await request.json();
    const { id } = await params;
    
    // Get the original reservation
    const original = await reservations.findOne({ _id: new ObjectId(id) });
    if (!original) {
      return new Response(
        JSON.stringify({ error: "Reservation not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the item in the items array
    const itemIndex = original.items.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) {
      return new Response(
        JSON.stringify({ error: "Item not found in reservation" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Decrement the pulled quantity for the specific item
    const result = await reservations.findOneAndUpdate(
      { 
        _id: new ObjectId(id),
        "items.itemId": itemId
      },
      {
        $inc: { "items.$.pulled": -returnedQuantity }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Failed to update reservation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const addToInventory = await inventory.findOneAndUpdate(
        {
            _id: new ObjectId(itemId)
        },
        {
            $inc: {
                reserved: returnedQuantity,
                quantity: returnedQuantity
            }
        }
    )

    if (!addToInventory) {
      return new Response(
        JSON.stringify({ error: "Failed to update reservation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reservation: result
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("PATCH error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}