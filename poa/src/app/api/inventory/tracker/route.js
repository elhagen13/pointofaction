import { MongoClient } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "trackedInventory";


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
    

    // Exeute query
    const trackers = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      data: trackers,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch images",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);


    // Parse request body
    const body = await request.json();
    // Prepare document for insertion
    const itemDocument = {
      key: body.key,
      quantity: body.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(itemDocument)

    // Insert the document
    await collection.insertOne(itemDocument);
    
    return Response.json(
        {
          success: true,
          data: itemDocument,
          message: "Sale Item created successfully",
        },
        { status: 201 }
      );

  } catch (error) {
    console.error("POST error:", error);

    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: "Duplicate entry",
          details: "A tracker with this information already exists",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Failed to create sale item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
