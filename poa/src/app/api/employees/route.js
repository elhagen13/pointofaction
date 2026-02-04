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


export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    // Exeute query
    const employees = await collection
    .find({})
    .sort({ index: 1 })
    .toArray();

    return Response.json({
      success: true,
      data: employees,
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

export async function PATCH(request){
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Parse request body
    const body = await request.json();
    console.log(body.emplList)
    const operations = []
    body.emplList.forEach((id, index) => operations.push({
      updateOne: {
        filter: { _id: new ObjectId(id)},
        update: { $set: {index: index}}
      }
    }) )

    console.log(operations)
    
    await collection.bulkWrite(operations);
    
    
      return Response.json({
        success: true,
        message: 'Employee Order changed  successfully'
      }, { status: 201 });
    
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        { 
          success: false, 
          error: 'Duplicate entry',
          details: 'an employee with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create employee',
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
    
    
    // Prepare document for insertion
    const employeeDocument = {
      photo: body.photo.trim(),
      name: body.name.trim(),
      role: body.role.trim(),
      ...(body.roleDescription.trim() && {roleDescription: body.roleDescription.trim()}),
      ...(body.email.trim() && {email: body.email.trim()}),
      ...(body.number.trim() && {number: body.number.trim()}),
      ...(body.capabilities && body.capabilities.length > 0 && {capabilities: body.capabilities})
    };
    
    // Insert the document
    const result = await collection.insertOne(employeeDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdEmployeeItem = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdEmployeeItem,
        message: 'Employee Item created successfully'
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
          details: 'an employee with this information already exists'
        },
        { status: 409 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create employee',
        details: error.message 
      },
      { status: 500 }
    );
  }
}