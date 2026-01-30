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

    const { dates, open, startTime, endTime } = await request.json();

    // ---- Validation ----
    if (!Array.isArray(dates) || dates.length === 0) {
      return Response.json(
        { success: false, error: "dates must be a non-empty array" },
        { status: 400 }
      );
    }

    if (open && (!startTime || !endTime)) {
      return Response.json(
        {
          success: false,
          error: "startTime and endTime are required when open is true",
        },
        { status: 400 }
      );
    }

    // ---- Bulk operations ----
    const ops = dates.map((date) => ({
      updateOne: {
        filter: { date },
        update: open
          ? {
              $set: {
                date,
                open: true,
                startTime,
                endTime,
              },
            }
          : {
              $set: {
                date,
                open: false,
              },
              $unset: {
                startTime: "",
                endTime: "",
              },
            },
        upsert: true,
      },
    }));

    await collection.bulkWrite(ops);

    return Response.json(
      {
        success: true,
        message: "Dates updated successfully",
        count: dates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/hours error:", error);

    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: "Duplicate date",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Failed to update dates",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
