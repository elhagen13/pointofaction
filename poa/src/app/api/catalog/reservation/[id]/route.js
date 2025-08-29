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

// GET items by itemId
export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid item ID format'
        },
        { status: 400 }
      );
    }

    const items = await collection.find({"items.itemId": id}).toArray();
    
    if (items.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'No items found with this ID'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch items',
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
      const { reservationDetails } = await request.json();
  
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return Response.json(
          { success: false, error: 'Invalid reservation ID format' },
          { status: 400 }
        );
      }
  
      // Process each reservation detail
      for (const detail of reservationDetails) {
        const { itemId, newReserved } = detail;
  
        // Try to update existing item first
        const updateExisting = await collection.updateOne(
          { 
            _id: new ObjectId(id),
            "items.itemId": itemId 
          },
          { 
            $set: { 
              "items.$.quantReserved": newReserved 
            } 
          }
        );
  
        // If no existing item was updated, push new item
        if (updateExisting.matchedCount === 0) {
          await collection.updateOne(
            { _id: new ObjectId(id) },
            { 
              $push: { 
                items: { 
                  itemId: itemId, 
                  quantReserved: newReserved 
                } 
              } 
            }
          );
        }
      }
  
      return Response.json({ success: true, message: 'Reservation updated successfully' });
  
    } catch (error) {
      console.error('PATCH error:', error);
      return Response.json(
        { success: false, error: 'Failed to update reservation', details: error.message },
        { status: 500 }
      );
    }
  }
  