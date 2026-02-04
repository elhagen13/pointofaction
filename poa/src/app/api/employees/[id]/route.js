import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'employees';

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


// PATCH - Update company by ID
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
          error: 'Invalid size ID format'
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
    const existingEmployee = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingEmployee) {
      return Response.json(
        {
          success: false,
          error: 'Item not found'
        },
        { status: 404 }
      );
    }

    // Prepare update document
    const updateDocument = {};
  
    
    // Update the document
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: {
        ...body.photo && {photo: body.photo.trim()},
        ...body.name && {name: body.name.trim()},
        ...body.role && {role: body.role.trim()},
        ...body.number && {number: body.number.trim()},
        ...body.email && {email: body.email.trim()},
        ...body.roleDescription && {roleDescription: body.roleDescription.trim()},
        ...body.capabilities && {capabilities: body.capabilities}
      } }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          error: 'Description not found'
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return Response.json(
        {
          success: true,
          message: 'No changes were made (data was identical)',
          data: existingBrand
        }
      );
    }

    // Return the updated document
    const updatedEmployee = await collection.findOne({ _id: new ObjectId(id) });

    return Response.json({
      success: true,
      data: updatedEmployee,
      message: 'Brand updated successfully'
    });

  } catch (error) {
    console.error('PATCH error:', error);
    
    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: 'Duplicate entry',
          details: 'A brand with this information already exists'
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to update brand',
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

    // Delete the document
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json(
        {
          success: false,
          error: 'Failed to delete brand'
        },
        { status: 500 }
      );
    }

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

