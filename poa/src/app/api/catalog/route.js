import { MongoClient } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = "test";
const COLLECTION_NAME = "catalog";

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

    // Execute query
    const catalogItems = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      data: catalogItems,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch catalog items",
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
    console.log("POST body:", body);

    // Handle delete mode
    if (body.deleteMode && body.inventoryId) {
      const existingItem = await collection.findOne({ key: body.key });

      if (!existingItem) {
        return Response.json(
          {
            success: false,
            error: "Catalog item not found",
            message: "Cannot delete from non-existent catalog item",
          },
          { status: 404 }
        );
      }

      // Find the item to delete
      const itemToDelete = existingItem.items.find(
        (item) => item.inventoryId === body.inventoryId
      );

      if (!itemToDelete) {
        return Response.json(
          {
            success: false,
            error: "Item not found",
            message: "No item found with the specified inventoryId",
          },
          { status: 404 }
        );
      }

      // Remove the item and adjust totalQuant
      const result = await collection.findOneAndUpdate(
        { key: body.key },
        {
          $pull: { items: { inventoryId: body.inventoryId } },
          $inc: { totalQuant: -itemToDelete.quantAvailable },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      return Response.json(
        {
          success: true,
          data: result.value,
          message: "Item deleted successfully",
        },
        { status: 200 }
      );
    }

    // ---- UPDATE / ADD MODE ----

    // Step 1: Remove this inventoryId from *any other key* where it exists
    const docsWithItem = await collection
      .find(
        { "items.inventoryId": body.inventoryId },
        { projection: { items: 1, _id: 1, key: 1 } }
      )
      .toArray();

    for (const doc of docsWithItem) {
      if (doc.key !== body.key) {
        const itemToRemove = doc.items.find(
          (i) => i.inventoryId === body.inventoryId
        );
        if (itemToRemove) {
          await collection.updateOne(
            { _id: doc._id },
            {
              $pull: { items: { inventoryId: body.inventoryId } },
              $inc: { totalQuant: -itemToRemove.quantAvailable },
              $set: { updatedAt: new Date() },
            }
          );
          console.log(
            `Removed inventoryId ${body.inventoryId} from key ${doc.key}`
          );
        }
      }
    }

    const existingItem = await collection.findOne({ key: body.key });

    // If key already exists in the catalog
    if (existingItem) {
      // Check if the inventoryId already exists inside this key
      const itemExists = existingItem.items.some(
        (i) => i.inventoryId === body.inventoryId
      );

      let result;

      if (itemExists) {
        // Update the existing item inside items[]
        result = await collection.findOneAndUpdate(
          { key: body.key, "items.inventoryId": body.inventoryId },
          {
            $set: {
              "items.$.quantAvailable": body.items[0].quantAvailable,
              updatedAt: new Date(),
            },
            $inc: {
              totalQuant:
                body.items[0].quantAvailable -
                existingItem.items.find(
                  (i) => i.inventoryId === body.inventoryId
                ).quantAvailable,
            },
          },
          { returnDocument: "after" }
        );
      } else {
        // If inventoryId not in this key yet → push it
        result = await collection.findOneAndUpdate(
          { key: body.key },
          {
            $push: { items: { $each: body.items } },
            $inc: { totalQuant: body.totalQuant },
            $set: { updatedAt: new Date() },
          },
          { returnDocument: "after" }
        );
      }

      return Response.json(
        {
          success: true,
          data: result.value,
          message: itemExists
            ? "Catalog item updated successfully"
            : "New item added to catalog key",
        },
        { status: 200 }
      );
    } else {
      // Create a new key
      const catalogItemDocument = {
        key: body.key,
        totalQuant: body.totalQuant,
        totalReserved: body.totalReserved || 0,
        items: body.items,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(catalogItemDocument);

      if (result.acknowledged) {
        const createdCatalogItem = await collection.findOne({
          _id: result.insertedId,
        });
        return Response.json(
          {
            success: true,
            data: createdCatalogItem,
            message: "Catalog item created successfully",
          },
          { status: 201 }
        );
      } else {
        throw new Error("Failed to insert document");
      }
    }
  } catch (error) {
    console.error("POST error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to process catalog item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
