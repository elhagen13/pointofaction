import { MongoClient, ObjectId } from 'mongodb'; 

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
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
      if (body.image !== undefined) {
          updateDocument.image = body.image.trim();
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
      if (body.sale !== undefined) {
        updateDocument.sale = body.sale;
      }
      if (body.public !== undefined) {
        updateDocument.public = body.public;
      }
      if (body.location !== undefined) {
        updateDocument.location = body.location;
      }
      if (body.discount !== undefined) {
        updateDocument.discount = body.discount;
      }
      if (body.minPrice !== undefined) {
        updateDocument.minPrice= body.minPrice;
      }

      //if a location is in the body, it means that it is not in a box,
      //so the boxId needs to be removed, and it should have a qr code
      const toRemove = {} 
      if(body.location){ 
        toRemove.boxId =  ""
        const websiteUrl = `https://www.pointofaction.com/admin/item/${id}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}`
        updateDocument.qrCode = qrCodeUrl
      }
      //if a box id has been included in the body, that means it is in a box
      // so the location needs to be removed, along with the QR Code
      if(body.box_id){ 
        toRemove.location =  "";
        toRemove.discount = "";
        toRemove.minPrice = "";
        toRemove.qrCode = "";
      }

      //if a descriptionID has been provided then remove the description,
      //if it has not been provided remove the descriptionId
      if(body.descriptionId && !body.description){ 
        toRemove.description =  "";
        updateDocument.descriptionId = body.descriptionId
      }
      else{
        toRemove.descriptionId = ""
        updateDocument.description = body.description.trim();
      }

      if(body.brandId && !body.brand){ 
        toRemove.brand =  "";
        updateDocument.brandId = body.brandId
      }
      else{
        toRemove.brandId = ""
        updateDocument.brand = body.brand.trim();
      }

      if(body.sizeId && !body.size){ 
        toRemove.size =  "";
        updateDocument.sizeId = body.sizeId
      }
      else{
        toRemove.sizeId = ""
        updateDocument.size = body.size.trim();
      }


      // Update the document
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDocument,
          $unset: toRemove  }
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
            error: 'Invalid item ID format'
          },
          { status: 400 }
        );
      }
  
      // Check if item exists before deletion
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
      const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: {archived: true}
      });
  
      if (result.deletedCount === 0) {
        return Response.json(
          {
            success: false,
            error: 'Item could not be deleted'
          },
          { status: 500 }
        );
      }
  
      return Response.json({
        success: true,
        message: 'Item deleted successfully',
        data: {
          deletedId: id,
          deletedItem: existingItem
        }
      });
  
    } catch (error) {
      console.error('DELETE error:', error);
      
      return Response.json(
        {
          success: false,
          error: 'Failed to delete item',
          details: error.message
        },
        { status: 500 }
      );
    }
  }