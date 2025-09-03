import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'reservations';

let cachedClient = null;
let cachedDb = null;

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
      const reservations = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
      return Response.json({
        success: true,
        data: reservations,
      });
      
    } catch (error) {
      console.error('GET error:', error);
      return Response.json(
        { 
          success: false, 
          error: 'Failed to fetch reservations',
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
    const sequentialId = await getNextSequenceId('reservation');
    
    // Prepare document for insertion
    const reservationDocument = {
      sequentialId: sequentialId,
      orderTitle: body.orderTitle,
      soIn: body.soIn,
      items: body.items,
      status: "Incomplete",
      internal: body.internal,
      customer: body.customer,
      createdAt: new Date(),
      updatedAt: new Date()
      
    }
   
    // Insert the document
    const result = await collection.insertOne(reservationDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdReservationItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdReservationItem,
        message: 'reservation Item created successfully'
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
          details: 'A reservation with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create reservation item',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

