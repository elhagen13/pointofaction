import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "companyItems";

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
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const inventory = await collection.aggregate([
      {
        $lookup: {
          from: "companyInventory",
          localField: "_id",
          foreignField: "itemId",
          as: "productDetails"
        }
      }, 
      {
        $lookup: {
          from: "overstockCompanies",
          localField: "companyId",
          foreignField: "_id",
          as: "company"
        }
      }
    ]).toArray();
    
    console.log(inventory);
    return Response.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch inventory",
        details: error.message,
      },
      { status: 500 } 
    );
  }
}
export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const companies = db.collection("overstockCompanies");
    const inventoryCollection = db.collection("companyInventory");
    
    const caseInsensitiveCollation = { locale: 'en', strength: 2 };
    const { id } = await params;

    
    if (!id) {
      return Response.json(
        { 
          success: false, 
          error: 'Item ID is required',
        },
        { status: 400 }
      );
    }
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid Item ID format',
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log(body);
    
    // Check if item exists
    const existingItem = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingItem) {
      return Response.json(
        { 
          success: false, 
          error: 'Item not found',
        },
        { status: 404 }
      );
    }
    
    // Update or create company if it has changed (case-insensitive)
    const companyResult = await companies.updateOne(
      { company: body.company },
      {
        $setOnInsert: {
          company: body.company,
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        }
      },
      { 
        upsert: true,
        collation: caseInsensitiveCollation
      }
    );
    
    let companyId = companyResult.upsertedId;
    if (!companyId) {
      const existingCompany = await companies.findOne(
        { company: body.company },
        { collation: caseInsensitiveCollation }
      );
      companyId = existingCompany._id;
    }
    
    // Update the item
    const itemUpdateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          companyId: companyId,
          name: body.name,
          type: body.type,
          material: body.material,
          color: body.color,
          image: body.image,
          updatedAt: new Date(),
        }
      }
    );
    
    if (!itemUpdateResult.acknowledged) {
      throw new Error('Failed to update item');
    }
    
    // Handle instances: Delete old ones and insert new ones
    // First, delete all existing instances for this item
    await inventoryCollection.deleteMany({ itemId: new ObjectId(id) });
    
    // Then insert the new instances
    const instanceDocuments = body.instances.map(instance => ({
      itemId: new ObjectId(id),
      orderId: instance.orderId,
      quantity: instance.quantity,
      location: instance.location,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const inventoryResult = await inventoryCollection.insertMany(instanceDocuments);
    
    if (inventoryResult.acknowledged) {
      return Response.json({
        success: true,
        data: {
          itemId: id,
          inventoryIds: Object.values(inventoryResult.insertedIds),
          updatedCount: itemUpdateResult.modifiedCount,
          insertedInstanceCount: inventoryResult.insertedCount
        },
        message: 'Item updated successfully'
      }, { status: 200 });
    } else {
      throw new Error('Failed to insert inventory instances');
    }
  } catch (error) {
    console.error('PATCH error:', error);
    
    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        { 
          success: false, 
          error: 'Duplicate entry',
          details: 'A combination with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to update item',
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

    // Check if company exists before deleting
    const existingItem= await collection.findOne({ _id: new ObjectId(id) });
    if (!existingItem) {
      return Response.json(
        {
          success: false,
          error: 'Company not found'
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
          error: 'Failed to delete'
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Deleted successfully',
      data: existingItem
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to delete',
        details: error.message
      },
      { status: 500 }
    );
  }
}