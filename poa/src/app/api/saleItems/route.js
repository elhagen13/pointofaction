import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'saleItems';

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
    const saleItems = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
    return Response.json({
      success: true,
      data: saleItems,
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
    const saleItemDocument = {
      name: body.name.trim(),
      itemDescription: body.description.trim(),
      imageLink: body.imageLink.trim(),
      discount: body.discount,
      location: body.location.trim(),
      contents: body.contents,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the document
    const result = await collection.insertOne(saleItemDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdSaleItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdSaleItem,
        message: 'Sale Item created successfully'
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
          details: 'A sale item with this information already exists'
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