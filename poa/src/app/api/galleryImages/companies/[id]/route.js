import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "g_companies";

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

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: "Invalid item ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!body) {
      return Response.json(
        { success: false, error: "Missing request body" },
        { status: 400 }
      );
    }

    const updateResult = await collection.findOneAndUpdate({
        _id: new ObjectId(id)
    },
    {
        $set: {
            company: body.company.trim(),
            image: body.image.trim(),
        }
    })

    

    if (!updateResult) {
      return Response.json(
        {
          success: false,
          error: "Item not found (invalid ID or document missing)",
        },
        { status: 404 }
      );
    }
    return Response.json(
      { success: true, data: updateResult.value },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH Error:", err);

    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}