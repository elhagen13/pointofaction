import { MongoClient, ObjectId } from "mongodb";

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
    const trackerCollection = db.collection("trackedInventory");
    
    // Step 1: Get all tracked keys
    const trackedItems = await trackerCollection.find({}).toArray();
    const trackedKeys = trackedItems.map(item => item.key);
    console.log("Tracked keys:", trackedKeys);
    
    if (trackedKeys.length === 0) {
      // If no tracked items, just return non-archived items
      const inventory = await collection
        .find({ archived: false })
        .sort({ createdAt: -1 })
        .toArray();
        
      return Response.json({
        success: true,
        data: inventory,
      });
    }
    
    // Step 2: Get all inventory items first
    const allInventory = await collection.find({}).toArray();
    console.log(`Found ${allInventory.length} inventory items`);
    
    // Step 3: Get all brands and sizes for lookup
    const brandsCollection = db.collection("brands");
    const sizesCollection = db.collection("sizes");
    
    const allBrands = await brandsCollection.find({}).toArray();
    const allSizes = await sizesCollection.find({}).toArray();
    
    // Create lookup maps
    const brandMap = {};
    const sizeMap = {};
    
    allBrands.forEach(brand => {
      brandMap[brand._id.toString()] = brand.brand;
    });
    
    allSizes.forEach(size => {
      sizeMap[size._id.toString()] = size.size;
    });
    
    console.log("Brand map:", brandMap);
    console.log("Size map:", sizeMap);
    
    // Step 4: Process each inventory item
    const processedInventory = [];
    
    for (const item of allInventory) {
      // Resolve brand
      let resolvedBrand;
      if (item.brandId && brandMap[item.brandId]) {
        resolvedBrand = brandMap[item.brandId];
      } else {
        resolvedBrand = item.brand;
      }
      
      // Resolve size
      let resolvedSize;
      if (item.sizeId && sizeMap[item.sizeId]) {
        resolvedSize = sizeMap[item.sizeId];
      } else {
        resolvedSize = item.size;
      }
      
      // Create composite key
      const compositeKey = `${resolvedBrand}-${item.style}-${resolvedSize}-${item.color}`;
            
      // Check if item should be included
      const shouldInclude = !item.archived || trackedKeys.includes(compositeKey);
      
      if (shouldInclude) {
        processedInventory.push(item);
      }
    }
    
    console.log(`Returning ${processedInventory.length} items`);
    
    // Step 5: Sort and return
    processedInventory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    return Response.json({
      success: true,
      data: processedInventory,
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

    // Parse request body
    const body = await request.json();
    console.log(body)
    // Prepare document for insertion
    const itemDocument = {
      image: body.image,
      style: body.style.trim(),
      color: body.color.trim(),
      quantity: body.quantity,
      price: body.price,
      sale: body.sale,
      public: body.public,
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    };
    // optional fields: if it is not in a box it should have the following
    if (body.box_id) itemDocument.boxId = body.box_id;
    if (body.location) itemDocument.location = body.location;
    if (body.discount) itemDocument.discount = body.discount;
    if (body.minPrice) itemDocument.minPrice = body.minPrice;

    //if it has a description Id, then upload the id, if not upload the description
    if(body.descriptionId) itemDocument.descriptionId = body.descriptionId;
    else itemDocument.description = body.description.trim();

    //if it has a brand Id, then upload the brand id, if not upload the brand
    if(body.brandId) itemDocument.brandId = body.brandId;
    else itemDocument.brand = body.brand.trim();

    //if it has a size Id, then upload the size id, if not upload the size
    if(body.sizeId) itemDocument.sizeId = body.sizeId;
    else itemDocument.size = body.size.trim();

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

export async function PATCH(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Parse request body
    const {
      ids,
      image,
      description,
      descriptionId,
      style,
      brand,
      brandId,
      size,
      sizeId,
      color,
      quantity,
      price
    } = await request.json();
    console.log(ids, image, description, descriptionId,
      style,
      brand,
      brandId,
      size,
      sizeId,
      color,
      quantity,
      price)

    // Validate ids
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { success: false, error: "Invalid or missing ids array" },
        { status: 400 }
      );
    }

    const mongoIds = ids.map(id => new ObjectId(id));
    console.log(mongoIds);

    const response = await collection.updateMany(
      {
        _id: { $in: mongoIds }
      },
      {
        $set: {
          ...(image && { image: image }),
          ...(description && { description: description }),
          ...(descriptionId && { descriptionId: descriptionId }),
          ...(style && { style: style }),
          ...(brand && { brand: brand }),
          ...(brandId && { brandId: brandId }),
          ...(size && { size: size }),
          ...(sizeId && { sizeId: sizeId }),
          ...(color && { color: color }),
          ...(quantity !== undefined && { quantity: parseInt(quantity) }),
          ...(price !== undefined && { price: price })
        }
      }
    );

    console.log(response);

    return Response.json({
      success: true,
      message: "Items updated successfully",
      matchedCount: response.matchedCount,
      modifiedCount: response.modifiedCount
    });

  } catch (error) {
    console.error("ERROR:", error);
    return Response.json(
      { 
        success: false, 
        error: "Failed to update items",
        details: error.message 
      },
      { status: 500 }
    );
  }
}