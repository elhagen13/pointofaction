import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'gallery';

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
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}


export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("g_companies");

    const gallery = await collection.find({}).toArray()

      console.log(gallery)

    return Response.json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message });
  }
}


/*
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const gallery = await collection
      .aggregate([
        {
          $group: {
            _id: "$company",
            logos: {
              $push: {
                $cond: [{ $eq: ["$logo", true] }, "$imageLink", null],
              },
            },
            images: {
              $push: {
                $cond: [{ $ne: ["$logo", true] }, "$imageLink", null],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            company: "$_id",
            logo: {
              $first: {
                $filter: {
                  input: "$logos",
                  as: "l",
                  cond: { $ne: ["$$l", null] },
                },
              },
            },
            images: {
              $filter: {
                input: "$images",
                as: "img",
                cond: { $ne: ["$$img", null] },
              },
            },
          },
        },
      ])
      .toArray();

      console.log(gallery)

    return Response.json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message });
  }
}

*/

