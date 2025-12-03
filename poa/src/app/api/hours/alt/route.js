import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "hours";

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

    const url = new URL(request.url);
    const dates = url.searchParams.get("dates").split(",");
    
    const matchingDates = await collection.find({date: {$in: dates}}).toArray();
    return Response.json({
      success: true,
      data: matchingDates,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch dates",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // Parse request body
    const body = await request.json();

    for (const [index, banner] of body.active.entries()) {
      collection.findOneAndUpdate(
        {
          _id: new ObjectId(banner._id),
        },
        {
          $set: {
            active: true,
            index: index,
          },
        }
      );
    }
    for (const [index, banner] of body.inactive.entries()) {
      collection.findOneAndUpdate(
        {
          _id: new ObjectId(banner._id),
        },
        {
          $set: {
            active: false,
            index: index,
          },
        }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Items edited successfully",
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
          details: "An item with this information already exists",
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

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // Parse request body
    const body = await request.json();

    const curActive = await collection.find({ active: true }).toArray();

    // Prepare document for insertion
    const itemDocument = {
      mobileImage: body.mobileImage.trim(),
      desktopImage: body.desktopImage.trim(),
      description: body.description.trim(),
      active: true,
      index: curActive.length,
      createdAt: new Date(),
    };

    // Insert the document
    const result = await collection.insertOne(itemDocument);

    if (result.acknowledged) {
      return Response.json(
        {
          success: true,
          message: "Item created successfully",
        },
        { status: 201 }
      );
    } else {
      throw new Error("Failed to insert document");
    }
  } catch (error) {
    console.error("POST error:", error);

    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: "Duplicate entry",
          details: "An item with this information already exists",
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
