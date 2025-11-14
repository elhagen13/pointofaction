import { MongoClient, ObjectId } from 'mongodb'; 

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'boxes';

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
    const collection = db.collection("inventory");
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

    const items = await collection.find({"boxId": id}).toArray();
    
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
    
    console.log(id);
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid box ID format'
        },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if body is empty
    if (Object.keys(body).length === 0) {
      return Response.json(
        {
          success: false,
          error: 'No update data provided'
        },
        { status: 400 }
      );
    }
    
    // Check if box exists
    const existingBox = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingBox) {
      return Response.json(
        {
          success: false,
          error: 'Box not found'
        },
        { status: 404 }
      );
    }
    
    // Prepare update document
    const updateDocument = {
      updatedAt: new Date()
    };
    
    // Handle field mappings and only include fields that are provided
    if (body.description !== undefined) {
      updateDocument.description = body.description.trim();
    }
    
    // Map imageLink to image field
    if (body.imageLink !== undefined) {
      updateDocument.image = body.imageLink.trim();
    }
    
    if (body.location !== undefined) {
      updateDocument.location = body.location.trim();
    }
    
    if (body.discount !== undefined) {
      updateDocument.discount = body.discount;
    }
    
    if (body.minPrice !== undefined) {
      updateDocument.minPrice = body.minPrice;
    }

    if(body.editHistory !== undefined){
      updateDocument.editHistory = body.editHistory
    }
    
    const historyDoc = {}
    if(body.history !== undefined){
      historyDoc.history = body.history
    }
   
    // Update the document
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: updateDocument,
        $push: historyDoc,
      }
    );
    
    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          error: 'Box not found'
        },
        { status: 404 }
      );
    }
    
    if (result.modifiedCount === 0) {
      return Response.json(
        {
          success: true,
          message: 'No changes were made (data was identical)',
          data: existingBox
        }
      );
    }
    
    // Return the updated document
    const updatedBox = await collection.findOne({ _id: new ObjectId(id) });
    
    return Response.json({
      success: true,
      data: updatedBox,
      message: 'Box updated successfully'
    });
    
  } catch (error) {
    console.error('PATCH error:', error);
    
    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: 'Duplicate entry',
          details: 'A box with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      {
        success: false,
        error: 'Failed to update box',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE company by ID
export async function DELETE(request, { params }) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(COLLECTION_NAME);
      const { id } = await params;
  
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return Response.json(
          {
            success: false,
            error: 'Invalid ID format'
          },
          { status: 400 }
        );
      }
  
      const existingItem = await collection.findOne({ _id: new ObjectId(id) });
      if (!existingItem) {
        return Response.json(
          {
            success: false,
            error: 'Item not found'
          },
          { status: 404 }
        );
      }
  
      // Archive the box
      await collection.findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: {archived: true}
      });
  
  
      return Response.json({
        success: true,
        message: 'Item deleted successfully',
        data: existingItem
      });
  
    } catch (error) {
      console.error('DELETE error:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to delete gallery item',
          details: error.message
        },
        { status: 500 }
      );
    }
  }
  
  