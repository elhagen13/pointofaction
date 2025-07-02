import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'vendors';

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
    const collection = db.collection(COLLECTION_NAME);
    
    // Exeute query
    const vendors = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
    return Response.json({
      success: true,
      data: vendors,
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch images',
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
    const vendorDocument = {
      company: body.company.trim(),
      imageLink: body.imageLink.trim(),
      category: body.category,
      link: body.link.trim(),
      blocked: body.blocked,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the document
    const result = await collection.insertOne(vendorDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdVendorItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdVendorItem,
        message: 'Vendor Item created successfully'
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
          details: 'A vendor with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create vendor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}