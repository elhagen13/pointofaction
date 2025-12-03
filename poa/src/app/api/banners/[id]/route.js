import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "banners";

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

export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;
    
    // Exeute query
    const banner = await collection
    .findOne({_id: new ObjectId(id)})
    
    return Response.json({
      success: true,
      data: banner,
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch banner',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;
    const body = await request.json();

    
    // Exeute query
    const banner = await collection
    .findOneAndUpdate({_id: new ObjectId(id)}, 
    {
        $set: {
            mobileImage: body.mobileImage.trim(),
            desktopImage: body.desktopImage.trim(),
            description: body.description.trim()
        }
    })
    
    return Response.json({
      success: true,
      data: banner,
    });
    
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to patchbanner',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

