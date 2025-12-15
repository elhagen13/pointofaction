import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'g_items';

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


export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("g_companies");
    
    // Exeute query
     const gallery = await collection
      .aggregate([
        {
          $lookup: {
            from: "g_items",
            localField: "_id",
            foreignField: "companyId",
            as: "items",
          },
        },
      ])
      .toArray();
    console.log(gallery)
    return Response.json({
      success: true,
      data: gallery,
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
    const companies = db.collection("g_companies")

    
    // Parse request body
    const body = await request.json();

    let companyId;
    //if a company image has been uploaded then it
    if(body.companyImage){
      const result = await companies.insertOne({
        company: body.company.trim(),
        image: body.companyImage.trim()
      })
      console.log(result)
      companyId = result.insertedId
    }
    else{
      const result = await companies.findOne({
        company: body.company.trim(),
      })
      if(!result) throw Error("Company does not exist")
      console.log(result)
      companyId = result._id
    }

   const result = await collection.insertOne({
      companyId: companyId,
      image: body.productImage.trim(),
      type: body.type.trim()
    })

    if (result.acknowledged) {
   
      return Response.json({
        success: true,
        message: 'Gallery Item created successfully'
      }, { status: 201 });
    } else {
      throw new Error('Failed to insert document');
    }


  }
  catch (error) {
    if (error.code === 11000) {
      return Response.json(
        { 
          success: false, 
          error: 'Duplicate entry',
          details: 'A gallery item with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create gallery image',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Parse request body
    const body = await request.json();
    
    
    // Prepare document for insertion
    const galleryDocument = {
      company: body.company.trim(),
      imageLink: body.imageLink.trim(),
      ...(body.type && { type: body.type.trim() }),
      logo: body.logo,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the document
    const result = await collection.insertOne(galleryDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdGalleryItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdGalleryItem,
        message: 'Gallery Item created successfully'
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
          details: 'A gallery item with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create company',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

 */