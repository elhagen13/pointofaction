import { MongoClient, ObjectId } from "mongodb";

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

    const allInventory = await collection
      .aggregate([
        {
          $match: {},
        },
        {
          $unwind: "$tags",
        },
        {
          $group: {
            _id: "$tags.tag",
            color: { $first: "$tags.color" },
            tag: { $first: "$tags.tag" },
          },
        },
        {
          $project: {
            _id: 0,
            tag: 1,
            color: 1,
          },
        },
        {
          $sort: { tag: 1 },
        },
      ])
      .toArray();
    console.log(allInventory);

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

export async function PATCH(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const body = await request.json();
    console.log(body)

    //either remove tag from document or add to tag from document

    const allInventory = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(body.id),
      },
      {
        [body.type === "add" ? "$push" : "$pull"]: {
          tags: {
            tag: body.tag,
            color: body.color,
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    console.log(allInventory)

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
