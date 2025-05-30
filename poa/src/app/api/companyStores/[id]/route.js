import { MongoClient, ObjectId } from 'mongodb';

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

// Validation function for partial company data updates
function validatePartialCompanyData(data) {
  const errors = [];
  
  // Only validate fields that are provided
  if (data.companyName !== undefined) {
    if (typeof data.companyName !== 'string' || data.companyName.trim() === '') {
      errors.push('companyName must be a non-empty string');
    }
  }
  
  if (data.companyLink !== undefined) {
    if (typeof data.companyLink !== 'string' || data.companyLink.trim() === '') {
      errors.push('companyLink must be a non-empty string');
    } else {
      // Validate URL format
      try {
        new URL(data.companyLink);
      } catch {
        errors.push('companyLink must be a valid URL');
      }
    }
  }
  
  if (data.companyImage !== undefined) {
    if (typeof data.companyImage !== 'string' || data.companyImage.trim() === '') {
      errors.push('companyImage must be a non-empty string');
    }
  }
  
  return errors;
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

    // Find the company
    const company = await collection.findOne({ _id: new ObjectId(id) });

    if (!company) {
      return Response.json(
        {
          success: false,
          error: 'Company not found'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: company
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

    // Validate provided fields
    const validationErrors = validatePartialCompanyData(body);
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

    // Check if company exists
    const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingCompany) {
      return Response.json(
        {
          success: false,
          error: 'Company not found'
        },
        { status: 404 }
      );
    }

    // Check for duplicate company name (if companyName is being updated)
    if (body.companyName && body.companyName.trim() !== existingCompany.companyName) {
      const duplicateCompany = await collection.findOne({
        companyName: body.companyName.trim(),
        _id: { $ne: new ObjectId(id) } // Exclude current company
      });

      if (duplicateCompany) {
        return Response.json(
          {
            success: false,
            error: 'Company name already exists',
            details: 'A company with this name already exists in the database'
          },
          { status: 409 }
        );
      }
    }

    // Prepare update document
    const updateDocument = {
      updatedAt: new Date()
    };

    // Only include fields that are provided and trim strings
    if (body.companyName !== undefined) {
      updateDocument.companyName = body.companyName.trim();
    }
    if (body.companyLink !== undefined) {
      updateDocument.companyLink = body.companyLink.trim();
    }
    if (body.companyImage !== undefined) {
      updateDocument.companyImage = body.companyImage.trim();
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
          error: 'Company not found'
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return Response.json(
        {
          success: true,
          message: 'No changes were made (data was identical)',
          data: existingCompany
        }
      );
    }

    // Return the updated document
    const updatedCompany = await collection.findOne({ _id: new ObjectId(id) });

    return Response.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('PATCH error:', error);
    
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
          error: 'Invalid company ID format'
        },
        { status: 400 }
      );
    }

    // Check if company exists before deleting
    const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingCompany) {
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
          error: 'Failed to delete company'
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Company deleted successfully',
      data: existingCompany
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to delete company',
        details: error.message
      },
      { status: 500 }
    );
  }
}