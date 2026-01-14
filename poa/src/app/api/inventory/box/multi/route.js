import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "boxes";

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

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    // Parse request body
    const body = await request.json();

    const desiredBoxIds = body.ids.map((id) => new ObjectId(id));

    const result = await collection
      .aggregate([
        { $match: { _id: { $in: desiredBoxIds } } },
        {
          $addFields: {
            boxStrId: { $toString: "$_id" },
          },
        },
        {
          $lookup: {
            from: "inventory",
            localField: "boxStrId",
            foreignField: "boxId",
            as: "boxItems",
          },
        },
        {
          $addFields: {
            sale: {
              $let: {
                vars: {
                  total: { $size: "$boxItems" },
                  saleCount: {
                    $size: {
                      $filter: {
                        input: "$boxItems",
                        as: "item",
                        cond: { $eq: ["$$item.sale", true] },
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $eq: ["$$saleCount", 0] },
                    "none",
                    {
                      $cond: [
                        { $eq: ["$$saleCount", "$$total"] },
                        "all",
                        "some",
                      ],
                    },
                  ],
                },
              },
            },
            public: {
              $let: {
                vars: {
                  total: { $size: "$boxItems" },
                  publicCount: {
                    $size: {
                      $filter: {
                        input: "$boxItems",
                        as: "item",
                        cond: { $eq: ["$$item.public", true] },
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $eq: ["$$publicCount", 0] },
                    "none",
                    {
                      $cond: [
                        { $eq: ["$$publicCount", "$$total"] },
                        "all",
                        "some",
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ])
      .toArray();

    if (result.length > 0) {
      return Response.json(
        {
          success: true,
          data: result,
          message: "Boxes found",
        },
        { status: 201 }
      );
    } else {
      throw new Error("No boxes found");
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
        error: error,
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
    const inventory = db.collection("inventory");
    // Parse request body
    const body = await request.json();

    const desiredBoxIds = body.boxIds.map((id) => new ObjectId(id));

    const boxEdits = await collection.updateMany(
      { _id: { $in: desiredBoxIds } },
      {
        $set : {
            ...(body.image && { image: body.image }),
            ...(body.location && { location: body.location.trim() }),
            ...(body.discount && { discount: body.discount }),
            ...(body.minPrice && { minPrice: body.minPrice }),

        }
      }
    );

    const inventoryEdits = await inventory.updateMany(
        {boxId: {$in: body.boxIds}}, 
        {
        $set : {
            ...("public" in body && {public: body.public}),
            ...("sale" in body && { sale: body.sale}),

        }
      }
    )

   if(boxEdits.acknowledged && inventoryEdits.acknowledged){
    return Response.json(
        {
          success: true,
          message: "Boxes updated",
        },
        { status: 201 }
      );
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
        error: error,
        details: error.message,
      },
      { status: 500 }
    );
  }
}
