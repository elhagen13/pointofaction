import { MongoClient, ObjectId } from 'mongodb'; 

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'inventory';

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
      const { id } = await params;
  
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return Response.json(
          {
            success: false,
            error: 'Invalid company ID format'
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
  
     
  
      // Check if company exists
      const existingBox = await collection.findOne({ _id: new ObjectId(id) });
      if (!existingBox) {
        return Response.json(
          {
            success: false,
            error: 'Company not found'
          },
          { status: 404 }
        );
      }
  
      // Prepare update document
      const updateDocument = {
        updatedAt: new Date()
      };
       
      // Only include fields that are provided and trim strings
      if (body.box_id !== undefined) {
        updateDocument.boxId = body.box_id.trim();
      }
      if (body.description !== undefined) {
        updateDocument.description = body.description.trim();
      }
      if (body.image !== undefined) {
          updateDocument.image = body.image.trim();
      }
      if (body.style !== undefined) {
        updateDocument.style = body.style.trim();
      }
      if (body.size !== undefined) {
        updateDocument.size = body.size.trim();
      }
      if (body.color !== undefined) {
        updateDocument.color = body.color.trim();
      }
      if (body.quantity !== undefined) {
        updateDocument.quantity = body.quantity;
      }
      if (body.price !== undefined) {
        updateDocument.price = body.quantity;
      }
      if (body.sale !== undefined) {
        updateDocument.sale = body.sale;
      }
      if (body.public !== undefined) {
        updateDocument.public = body.quantity;
      }
      
  
      
      // Update the document
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDocument }
      );
  
      if (result.matchedCount === 0) {
        return Response.json(
          {
            success: false,
            error: 'Item not found'
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
      const updatedCompany = await collection.findOne({ _id: new ObjectId(id) });
  
      return Response.json({
        success: true,
        data: updatedCompany,
        message: 'Item updated successfully'
      });
  
    } catch (error) {
      console.error('PATCH error:', error);
      
      // Handle duplicate key error (if you have unique indexes)
      if (error.code === 11000) {
        return Response.json(
          {
            success: false,
            error: 'Duplicate entry',
            details: 'An item with this information already exists'
          },
          { status: 409 }
        );
      }
  
      return Response.json(
        {
          success: false,
          error: 'Failed to update company',
          details: error.message
        },
        { status: 500 }
      );
    }
  }
  