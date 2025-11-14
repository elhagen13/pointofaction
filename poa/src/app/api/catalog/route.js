import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
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
    const inventory = db.collection(COLLECTION_NAME);
    const boxes = db.collection("boxes");
    const brands = db.collection("brands");
    const sizes = db.collection("sizes");

    // Parse query parameters from URL
    const url = new URL(request.url);
    const style = url.searchParams.get('style');
    const color = url.searchParams.get('color');
    const brand = url.searchParams.get('brand');
    const size = url.searchParams.get('size');

    console.log(style, color, brand, size)

    // Validation - require at least style and color, plus either brand or size
    if (!style || !color || (!brand && !size)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: style, color, and either brand or size" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get brandId and sizeId if needed
    let brandId = null;
    let sizeId = null;

    if (brand) {
      const brandDoc = await brands.findOne({ brand: { $regex: `^${brand}$`, $options: 'i' } });
      brandId = brandDoc?._id;
    }

    if (size) {
      const sizeDoc = await sizes.findOne({ size: { $regex: `^${size}$`, $options: 'i' } });
      sizeId = sizeDoc?._id;
    }

    const matchQuery = {
      archived: false,
      style,
      color,
      ...(brandId || brand ? {
        $or: [
          ...(brandId ? [{ brandId: String(brandId) }] : []),
          ...(brand ? [{ brand: brand }] : []),
        ]
      } : {}),
      ...(sizeId || size ? {
        $or: [
          ...(sizeId ? [{ sizeId: String(sizeId) }] : []),
          ...(size ? [{ size: size }] : []),
        ]
      } : {}),
      $expr: {
        $gt: ["$quantity", "$reserved"]
      }
    };


    // Use aggregation pipeline to join with boxes collection
    const pipeline = [
      { $match: matchQuery, },
      {
        $addFields: {
          boxObjectId: { $toObjectId: "$boxId" }
        }
      },
      {
        $lookup: {
          from: "boxes",
          localField: "boxObjectId",
          foreignField: "_id",
          as: "boxInfo"
        }
      },
      {
        $addFields: {
          boxSequentialId: {
            $arrayElemAt: ["$boxInfo.boxId", 0]
          }
        }
      },
      {
        $project: {
          boxInfo: 0, // Remove the boxInfo array from the final result
          boxObjectId: 0 // Remove the temporary boxObjectId field
        }
      }
    ];

    const matches = await inventory.aggregate(pipeline).toArray();

    return new Response(
      JSON.stringify(matches),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("GET error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(request, res) {
  try {
    const { db } = await connectToDatabase();
    const inventory = db.collection(COLLECTION_NAME);
    const boxes = db.collection("boxes");
    const brands = db.collection("brands");
    const sizes = db.collection("sizes");

    // Parse request body
    const { style, color, brand, size, quantityToReserve } = await request.json();

    // Validation
    if (!style || !color || (!brand && !size) || !quantityToReserve) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (quantityToReserve <= 0) {
      return new Response(
        JSON.stringify({ error: "quantityToReserve must be greater than 0" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get brandId and sizeId if needed (await the promises!)
    let brandId = null;
    let sizeId = null;

    if (brand) {
      const brandDoc = await brands.findOne({ brand: { $regex: `^${brand}$`, $options: 'i' } });
      brandId = brandDoc?._id;
    }

    if (size) {
      const sizeDoc = await sizes.findOne({ size: { $regex: `^${size}$`, $options: 'i' } });
      sizeId = sizeDoc?._id;
    }

    const query = {
      style,
      color,
      ...(brandId && { brandId: String(brandId) }),
      ...(sizeId && { sizeId: String(sizeId) })
    };


    console.log("Final query being sent:", JSON.stringify(query));

    // Find matching items and sort by reserved quantity (most to least)
    const matches = await inventory.aggregate([
      { $match: query },
      {
        $addFields: {
          availableQuantity: {
            $subtract: [{ $ifNull: ["$quantity", 0] },
            { $ifNull: ["$reserved", 0] }]
          }
        }
      },
      { $sort: { availableQuantity: 1, _id: 1 } }
    ]).toArray();

    console.log("MATCHES-", matches)


    const totalAvailable = matches.reduce((total, item) => {
      const reserved = item.reserved || 0;
      const available = Math.max(0, item.quantity - reserved);
      return total + available;
    }, 0);

    if (totalAvailable < quantityToReserve) {
      throw new Error(`Insufficient inventory. Requested: ${quantityToReserve}, Available: ${totalAvailable}`);
    }

    let remainingToReserve = quantityToReserve;
    const updatedItems = [];
    const reservationDetails = [];

    // Process items in order (most reserved first)
    for (const item of matches) {
      console.log(item)
      if (remainingToReserve <= 0) break;

      const currentReserved = item.reserved || 0;
      const availableInThisItem = Math.max(0, item.quantity - currentReserved);

      if (availableInThisItem === 0) continue;

      // Determine how much to reserve from this item
      const toReserveFromThisItem = Math.min(remainingToReserve, availableInThisItem);
      const newReservedTotal = currentReserved + toReserveFromThisItem;

      // Update the item
      const updatedItem = await inventory.findOneAndUpdate(
        { _id: new ObjectId(item._id) },
        {
          $set: {
            reserved: newReservedTotal,
            updatedAt: new Date()
          }
        },
        { returnDocument: "after" }
      );

      let box = null;
      if (item.boxId) {
        box = await boxes.findOne(
          { _id: new ObjectId(item.boxId) }
        )
      }

      updatedItems.push(updatedItem);
      reservationDetails.push({
        itemId: item._id,
        image: item.image,
        style: item.style,
        ...(item.brandId && { brand: item.brandId }),
        ...(item.brand && { brand: item.brand }),
        color: item.color,
        ...(item.sizeId && { size: item.sizeId }),
        ...(item.size && { size: item.size }),
        ...(item.location && { location: item.location }),
        ...(box && {
          boxId: box.boxId,
          location: box.location
        }),
        previousReserved: currentReserved,
        newReserved: newReservedTotal,
        quantityReservedFromThisItem: toReserveFromThisItem,
        availableAfterReservation: item.quantity - newReservedTotal
      });

      remainingToReserve -= toReserveFromThisItem;
    }

    const result = {
      success: true,
      totalQuantityReserved: quantityToReserve,
      itemsUpdated: updatedItems.length,
      reservationDetails,
      updatedItems: updatedItems.map(item => ({
        _id: item._id,
        style: item.style,
        color: item.color,
        quantity: item.quantity,
        reserved: item.reserved,
        available: item.quantity - (item.reserved || 0)
      }))
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );



  } catch (error) {
    console.error("PATCH error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}



export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const { itemIds } = await request.json();
    var objectIds = itemIds.map(id => new ObjectId(id))
    console.log(objectIds)
    const items = await collection.find({ "_id": { $in: objectIds } }).toArray();
    console.log(items)

    if (items.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'No items found with this ID'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch items',
        details: error.message
      },
      { status: 500 }
    );
  }
}


