import { MongoClient } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = "test";
const COLLECTION_NAME = "inventory";

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

    // Exeute query
    const inventory = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return Response.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch images",
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

    // Parse request body
    const body = await request.json();

    // Prepare document for insertion
    const itemDocument = {
      description: body.description.trim(),
      image: body.image,
      style: body.style.trim(),
      size: body.size.trim(),
      color: body.color.trim(),
      quantity: body.quantity,
      price: body.price,
      sale: body.sale,
      public: body.public,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // optional fields: if it is not in a box it should have the following
    if(body.brand) itemDocument.brand = body.brand.trim()
    if (body.box_id) itemDocument.boxId = body.box_id;
    if (body.location) itemDocument.location = body.location;
    if (body.discount) itemDocument.discount = body.discount;
    if (body.minPrice) itemDocument.minPrice = body.minPrice;

    // Insert the document
    const result = await collection.insertOne(itemDocument);

    if (result.acknowledged) {
      // Generate QR code URL using the inserted MongoDB ID
      if (!body.box_id) {
        const mongoId = result.insertedId.toString();
        const websiteUrl = `https://www.pointofaction.com/admin/item/${mongoId}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}`;

        // Update the document with the QR code URL
        await collection.updateOne(
          { _id: result.insertedId },
          {
            $set: {
              qrCode: qrCodeUrl,
              updatedAt: new Date(),
            },
          }
        );
      }

      // Return the created document with QR code
      const createdSaleItem = await collection.findOne({
        _id: result.insertedId,
      });

      return Response.json(
        {
          success: true,
          data: createdSaleItem,
          message: "Sale Item created successfully",
        },
        { status: 201 }
      );
    } else {
      throw new Error("Failed to insert document");
    }
  } catch (error) {
    console.error("POST error:", error);

    // Handle duplicate key error (if you have unique indexes)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          error: "Duplicate entry",
          details: "A sale item with this information already exists",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Failed to create sale item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
