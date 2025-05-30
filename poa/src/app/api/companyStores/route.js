import { MongoClient } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'companies';

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

// Validation function for company data
function validateCompanyData(data) {
  const errors = [];
  
  if (!data.companyName || typeof data.companyName !== 'string' || data.companyName.trim() === '') {
    errors.push('companyName is required and must be a non-empty string');
  }
  
  if (!data.companyLink || typeof data.companyLink !== 'string' || data.companyLink.trim() === '') {
    errors.push('companyLink is required and must be a non-empty string');
  }
  
  if (!data.companyImage || typeof data.companyImage !== 'string' || data.companyImage.trim() === '') {
    errors.push('companyImage is required and must be a non-empty string');
  }
  
  // Optional: Validate URL format
  if (data.companyLink) {
    try {
      new URL(data.companyLink);
    } catch {
      errors.push('companyLink must be a valid URL');
    }
  }
  
  return errors;
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 0;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const companyName = searchParams.get('companyName');
    
    // Build query filter
    let filter = {};
    if (companyName) {
      filter.companyName = { $regex: companyName, $options: 'i' }; // Case-insensitive search
    }
    
    // Execute query
    const companies = await collection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray();
    
    // Get total count for pagination
    const totalCount = await collection.countDocuments(filter);
    
    return Response.json({
      success: true,
      data: companies,
      pagination: {
        total: totalCount,
        limit: limit || totalCount,
        skip: skip,
        hasMore: skip + (limit || totalCount) < totalCount
      }
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch companies',
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
    
    // Validate required fields
    const validationErrors = validateCompanyData(body);
    if (validationErrors.length > 0) {
      return Response.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // Check if company already exists (optional - remove if duplicates are allowed)
    const existingCompany = await collection.findOne({ 
      companyName: body.companyName.trim() 
    });
    
    if (existingCompany) {
      return Response.json(
        { 
          success: false, 
          error: 'Company already exists',
          details: 'A company with this name already exists in the database'
        },
        { status: 409 }
      );
    }
    
    // Prepare document for insertion
    const companyDocument = {
      companyName: body.companyName.trim(),
      companyLink: body.companyLink.trim(),
      companyImage: body.companyImage.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the document
    const result = await collection.insertOne(companyDocument);
    
    if (result.acknowledged) {
      // Return the created document
      const createdCompany = await collection.findOne({ _id: result.insertedId });
      
      return Response.json({
        success: true,
        data: createdCompany,
        message: 'Company created successfully'
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
          details: 'A company with this information already exists'
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