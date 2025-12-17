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

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const companies = db.collection("overstockCompanies");
    
    const caseInsensitiveCollation = { locale: 'en', strength: 2 };
    
    const body = await request.json();
    console.log(body)
    
    // First add the company if it has not been added (case-insensitive)
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
    
    // Then insert the item type if it has not been added
    const itemResult = await collection.updateOne(
      {
        companyId: companyId,
        type: body.type,
        material: body.material,
        color: body.color,
        name: body.name
      },
      {
        $setOnInsert: {
          image: body.image,
          companyId: companyId,
          name: body.name,
          type: body.type,
          material: body.material,
          color: body.color,
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
    
    // Get the item _id
    const itemId = itemResult.upsertedId || 
      (await collection.findOne({
        companyId: companyId,
        type: body.type,
        material: body.material,
        color: body.color
      }, { collation: caseInsensitiveCollation }))._id;
    
    
    const inventoryCollection = db.collection("companyInventory");

    const instanceDocuments = body.instances.map(instance => ({
      itemId: itemId,
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
          itemId: itemId,
          inventoryId: inventoryResult.insertedId
        },
        message: 'Item created successfully'
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
          details: 'A combination with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create item',
        details: error.message 
      },
      { status: 500 }
    );
  }
}