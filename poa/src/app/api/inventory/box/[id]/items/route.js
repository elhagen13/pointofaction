import { MongoClient, ObjectId } from "mongodb";

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

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;
    const { sale, pub } = await request.json();

    const inventory = await collection.updateMany(
      { boxId: id },
      { $set: {
        sale: sale,
        public: pub,
      }
        
      }
    );
    return Response.json({
      success: true,
      data: inventory,
    });
  } catch(error) {
    return Response.json(
      {
        success: false,
        error: "Failed to update visibility",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
