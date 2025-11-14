import { MongoClient } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
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

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
       const allInventory = await collection.find({}).toArray();
      
    return Response.json({
      success: true,
      data: allInventory,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch inventory",
        details: error.message,
      },
      { status: 500 }
    );
  }
}