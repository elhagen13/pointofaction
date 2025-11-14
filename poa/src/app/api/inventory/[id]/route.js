import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
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


// GET single company by ID
export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = params;

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

    // Find the sale item
    const saleItem = await collection.findOne({ _id: new ObjectId(id) });

    if (!saleItem) {
      return Response.json(
        {
          success: false,
          error: 'Sale Item not found'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: saleItem
    });

  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch company',
        details: error.message
      },
      { status: 500 }
    );
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
          error: 'Invalid saleItem ID format'
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log(body)
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
    const existingSaleItem = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingSaleItem) {
      return Response.json(
        {
          success: false,
          error: 'Item not found'
        },
        { status: 404 }
      );
    }

    // Prepare update document
    const updateDocument = {
      updatedAt: new Date()
    };

  
    // Only include fields that are provided and trim strings
    if (body.name !== undefined) {
      updateDocument.name = body.name.trim();
    }
    if (body.itemDescription !== undefined) {
        updateDocument.itemDescription= body.itemDescription.trim();
      }
    if (body.imageLink !== undefined) {
      updateDocument.imageLink = body.imageLink.trim();
    }
    if(body.contents !== undefined){
      updateDocument.contents = body.contents
    }
    if (body.discount !== undefined) {
      updateDocument.discount = body.discount.trim();
    }
    if (body.minPrice !== undefined) {
      updateDocument.minPrice = body.minPrice;
    }
    if (body.location !== undefined) {
      updateDocument.location = body.location.trim();
    }
    if (body.size !== undefined) {
      updateDocument.size = body.size.trim();
    }
    if (body.style !== undefined) {
      updateDocument.style = body.style.trim();
    }
    if (body.color !== undefined) {
      updateDocument.color = body.color.trim();
    }
    if (body.quantity !== undefined) {
      updateDocument.quantity = body.quantity;
    }
    if (body.price !== undefined) {
      updateDocument.price = body.price;
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
          error: 'Sale Item not found'
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return Response.json(
        {
          success: true,
          message: 'No changes were made (data was identical)',
          data: existingSaleItem
        }
      );
    }

    // Return the updated document
    const updatedSaleItem = await collection.findOne({ _id: new ObjectId(id) });

    return Response.json({
      success: true,
      data: updatedSaleItem,
      message: 'Sale Item updated successfully'
    });

  } catch (error) {
    console.error('PATCH error:', error);
    
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
        error: 'Failed to update company',
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
    const { id } = params;

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
          error: 'Failed to delete company'
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

