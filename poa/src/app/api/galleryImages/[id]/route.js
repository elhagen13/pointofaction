import AddItem from "@/app/admin/companyInventory/AddItem";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "gallery";

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
          error: "Invalid company ID format",
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
          error: "Company not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch company",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH - Update company by ID
/** 
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
    const existingGalleryItem = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingGalleryItem) {
      return Response.json(
        {
          success: false,
          error: 'Image not found'
        },
        { status: 404 }
      );
    }

    // Prepare update document
    const updateDocument = {
      updatedAt: new Date()
    };

    const unsetDocument = {

    }
    console.log(body)

    // Only include fields that are provided and trim strings
    if (body.company !== undefined) {
      updateDocument.company = body.company.trim();
    }
    if (body.imageLink !== undefined) {
      updateDocument.imageLink = body.imageLink.trim();
    }
    if (body.type !== undefined && !body.logo) {
      updateDocument.type = body.type.trim();
    }
    else if(body.logo){
      unsetDocument.type = null
    }
    if(body.logo !== undefined){
      updateDocument.logo = body.logo;
    }

    console.log(updateDocument, unsetDocument)

    // Update the document
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDocument,
         $unset: unsetDocument
       },
    );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          error: 'Gallery Item not found'
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return Response.json(
        {
          success: true,
          message: 'No changes were made (data was identical)',
          data: existingGalleryItem
        }
      );
    }

    // Return the updated document
    const updatedGalleryItem = await collection.findOne({ _id: new ObjectId(id) });

    return Response.json({
      success: true,
      data: updatedGalleryItem,
      message: 'Gallery Item updated successfully'
    });

  } catch (error) {
    console.error('PATCH error:', error);
    
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
        error: 'Failed to update company',
        details: error.message
      },
      { status: 500 }
    );
  }
}
*/

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("g_items");
    const companies = db.collection("g_companies");

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: "Invalid item ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!body) {
      return Response.json(
        { success: false, error: "Missing request body" },
        { status: 400 }
      );
    }

    let companyId = body.companyId || null;

    // If no companyId, create new company first
    if (!companyId) {
      if (!body.company || !body.company.trim()) {
        return Response.json(
          {
            success: false,
            error: "Company name is required when creating a new company.",
          },
          { status: 400 }
        );
      }

      const insertResult = await companies.insertOne({
        company: body.company.trim(),
      });

      companyId = insertResult.insertedId;
    }

    // Perform update
    const updateResult = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          companyId: new ObjectId(companyId),
          image: body.image?.trim() || "",
          type: body.type?.trim() || "",
        },
      },
      { returnDocument: "after" }
    );

    console.log("updateResult:", updateResult);

    if (!updateResult) {
      return Response.json(
        {
          success: false,
          error: "Item not found (invalid ID or document missing)",
        },
        { status: 404 }
      );
    }
    return Response.json(
      { success: true, data: updateResult.value },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH Error:", err);

    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE company by ID
export async function DELETE(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("g_items");
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid id format",
        },
        { status: 400 }
      );
    }

    // Check if item exists before deleting
    const existingGalleryItem = await collection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingGalleryItem) {
      return Response.json(
        {
          success: false,
          error: "Item not found",
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
          error: "Failed to delete company",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Item deleted successfully",
      data: existingGalleryItem,
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to delete gallery item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
