import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'reservations';

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

export async function PATCH(request, { params }) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(COLLECTION_NAME);
      const { id, itemId } = await params;
  
      const { newAmount } = await request.json();
  
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return Response.json(
          { success: false, error: 'Invalid reservation ID format' },
          { status: 400 }
        );
      }
      
      await collection.updateOne(
        {_id: new ObjectId(id),
          "items.itemId": itemId },
        {
          $set: {
            "items.$.pulled": newAmount
          }
        }
      )
  
      return Response.json({ success: true, message: 'Reservation updated successfully' });
  
    } catch (error) {
      console.error('PATCH error:', error);
      return Response.json(
        { success: false, error: 'Failed to update reservation', details: error.message },
        { status: 500 }
      );
    }
  }
  