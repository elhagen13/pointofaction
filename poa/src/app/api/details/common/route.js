import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'commonInventory';

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


export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Exeute query
    const combos = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
    return Response.json({
      success: true,
      data: combos,
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch combos',
        details: error.message 
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
    const itemDocument = 
    {
      image: body.image.trim(),
      style: body.style.trim(),
      color: body.color.trim(),
      price: body.price,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    console.log(body)

    if(body.description) itemDocument.description = body.description.trim();
    else if(body.descriptionId) itemDocument.descriptionId = body.descriptionId;
    else throw new Error("Neither description or description id provided")
    

    if(body.brand) itemDocument.brand = body.brand.trim();
    else if(body.brandId) itemDocument.brandId = body.brandId;
    else throw new Error("Neither brand or brand id provided")


    if(body.size) itemDocument.size = body.size.trim();
    else if(body.sizeId) itemDocument.sizeId = body.sizeId
    else throw new Error("Neither size or size id provided")

 
    // Insert the document
    const result = await collection.insertOne(itemDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdItem,
        message: 'Combination created successfully'
      }, { status: 201 });
    } else {
      throw new Error('Failed to insert document');
    }
    
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        { 
          success: false, 
          error: 'Duplicate entry',
          details: 'A combination with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create sale item',
        details: error.message 
      },
      { status: 500 }
    );
  }
}