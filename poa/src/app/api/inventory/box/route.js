import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'boxes';

let cachedClient = null;
let cachedDb = null;

// Initialize counter (run once)
async function initializeCounter() {
    const { db } = await connectToDatabase();
    const counters = db.collection('counters');
    
    await counters.updateOne(
      { _id: 'box_id' },
      { $setOnInsert: { sequence_value: 1 } },
      { upsert: true }
    );
}
  
  // Get next sequential ID
  async function getNextSequenceId(sequenceName) {
    const { db } = await connectToDatabase();
    const counters = db.collection('counters');
    
    const result = await counters.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    
    return result.sequence_value;
  }
  

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
    const boxes = await collection
    .find({archived: { $in: [null, false]}})
    .sort({ createdAt: -1 })
    .toArray();
    return Response.json({
      success: true,
      data: boxes,
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
    const sequentialId = await getNextSequenceId('box_id');

    const websiteUrl = `https://www.pointofaction.com/admin/box/${sequentialId.toString().padStart(4, "0")}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}`;
    
    // Prepare document for insertion
    const saleItemDocument = {
      boxId: sequentialId.toString().padStart(4, "0"),
      description: body.description.trim(),
      qrCode: qrCodeUrl,
      image: body.imageLink.trim(),
      location: body.location.trim(),
      history: body.history,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    if(body.discount) saleItemDocument.discount = body.discount;
    if(body.minPrice) saleItemDocument.minPrice = body.minPrice;
  
    
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