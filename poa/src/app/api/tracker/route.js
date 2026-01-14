import { MongoClient } from "mongodb";
import { cookies } from "next/headers";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "tracker";

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


export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const body = await request.json();
    const page = body.page?.trim() || "home";

    const cookieName = `visited_${page}`;
    const visitedCookie = request.cookies.get(cookieName);

    const isFirstVisit = !visitedCookie;

    const document = {
      page,
      firstVisitThisMonth: isFirstVisit,
      timestamp: new Date(),
    };

    await collection.insertOne(document);

    const response = Response.json({
      success: true,
      firstVisitThisMonth: isFirstVisit,
    });

    if (isFirstVisit) {
      response.headers.append(
        "Set-Cookie",
        `${cookieName}=true; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
      );
    }

    return response;
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}
