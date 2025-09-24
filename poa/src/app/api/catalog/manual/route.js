import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = "test";
const COLLECTION_NAME = "inventory";

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

export async function PATCH(request, res) {
  try {
    const { db } = await connectToDatabase();
    const inventory = db.collection(COLLECTION_NAME);
    const boxes = db.collection("boxes");

    // Parse request body - using boxId instead of inventoryId to match frontend
    const { inventoryId, quantityToReserve } = await request.json();
    console.log(inventoryId, quantityToReserve)

    // Validation
    if (!inventoryId || !quantityToReserve) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: boxId and quantityToReserve" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (quantityToReserve <= 0) {
      return new Response(
        JSON.stringify({ error: "quantityToReserve must be greater than 0" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );

    }
    console.log

    // Update the box to reserve the quantity
    const updatedItem = await inventory.findOneAndUpdate(
      { _id: new ObjectId(inventoryId) },
      { $inc: { reserved: quantityToReserve } },
      { returnDocument: 'after' }
    );


    if (!updatedItem) {
      return new Response(
        JSON.stringify({ error: "Failed to update box reservation" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }


    // Find the box first to get its details
    const box = await boxes.findOne({ _id: new ObjectId(updatedItem.boxId) });
    
    if (!box) {
      return new Response(
        JSON.stringify({ error: "Box not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    

    // Build reservation details
    const reservationDetails = [];
    reservationDetails.push({
      itemId: updatedItem._id,
      image: updatedItem.image || null,
      style: updatedItem.style,
      brand: updatedItem.brandId || updatedItem.brand,
      color: updatedItem.color,
      size: updatedItem.sizeId || updatedItem.size,
      location: updatedItem.location,
      boxId: updatedItem.boxSequentialId || updatedItem._id,
      quantityReservedFromThisItem: quantityToReserve
    });

    const result = {
      success: true,
      totalQuantityReserved: quantityToReserve,
      itemsUpdated: 1,
      reservationDetails,
      updatedItems: [{
        _id: updatedItem._id,
        style: updatedItem.style,
        color: updatedItem.color,
        quantity: updatedItem.quantity,
        reserved: updatedItem.reserved,
        available: updatedItem.quantity - updatedItem.reserved
      }]
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("PATCH error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}