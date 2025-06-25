import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'sale';

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
    
    // Find the single sale document
    const saleDocument = await collection.findOne({});
    
    // If no document exists, create one with default value
    if (!saleDocument) {
      const defaultDoc = {
        sale: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.insertOne(defaultDoc);
      
      return Response.json({
        success: true,
        data: { sale: false },
        message: 'Sale document created with default value'
      });
    }
    
    return Response.json({
      success: true,
      data: { sale: saleDocument.sale },
      message: 'Sale status retrieved successfully'
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch sale status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Parse request body
    const body = await request.json();
    
    // Validate that sale field is provided and is boolean
    if (typeof body.sale !== 'boolean') {
      return Response.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: 'Sale field must be a boolean value (true or false)'
        },
        { status: 400 }
      );
    }
    
    // Update or create the sale document
    const result = await collection.updateOne(
      {}, // Empty filter to match any document (since there's only one)
      {
        $set: {
          sale: body.sale,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true } // Create document if it doesn't exist
    );
    
    if (result.acknowledged) {
      // Get the updated document
      const updatedDocument = await collection.findOne({});
      
      return Response.json({
        success: true,
        data: { sale: updatedDocument.sale },
        message: `Sale status ${result.upsertedCount > 0 ? 'created' : 'updated'} successfully`
      });
    } else {
      throw new Error('Failed to update sale status');
    }
    
  } catch (error) {
    console.error('PUT error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to update sale status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}