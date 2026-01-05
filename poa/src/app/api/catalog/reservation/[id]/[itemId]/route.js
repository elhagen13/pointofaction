import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "reservations";

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

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const inventory = db.collection("inventory");
    const boxes = db.collection("boxes");
    const { id, itemId } = await params;

    const { newAmount, history, patchType } = await request.json();

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: "Invalid reservation ID format" },
        { status: 400 }
      );
    }

    // first check to make sure the new amount is not greater than the amount requested
    const existingReservation = await collection
      .find(
        {
          _id: new ObjectId(id),
          "items.itemId": itemId,
        },
        {
          projection: {
            items: {
              $elemMatch: { itemId: itemId },
            },
          },
        }
      )
      .toArray();

    const existingItem = await inventory.findOne({
      _id: new ObjectId(itemId),
    });

    if (!existingReservation || !existingItem)
      throw Error("Reservation or item does not exist");
    else if (
      patchType !== "change" &&
      (newAmount > existingReservation[0]?.items[0].quantReserved ||
        newAmount > existingItem.quantity ||
        newAmount > existingItem.reserved)
    ) {
      throw Error(
        "Attempting to reserve more items than the resevation has reserved"
      );
    }
  
    await collection.updateOne(
      {
        _id: new ObjectId(id),
        "items.itemId": itemId,
      },
      {
        $inc: {
          "items.$.pulled": newAmount,
          ...(patchType == "change" && { "items.$.quantReserved": newAmount }),
        },
      }
    );

    //remove or add the new amount from the inventory item
    // if quantity <= 0, archive it
    await inventory.updateOne(
      {
        _id: new ObjectId(itemId),
      },
      {
        $inc: {
          quantity: newAmount * -1,
          reserved: patchType == "change" ? 0 : newAmount * -1,
        },
      }
    );

    // Then conditionally archive if quantity is now 0
    await inventory.updateOne(
      {
        _id: new ObjectId(itemId),
        quantity: 0,
      },
      {
        $set: {
          archived: true,
        },
      }
    );
    await inventory.updateOne(
      {
        _id: new ObjectId(itemId),
        quantity: { $gt: 0 },
      },
      {
        $set: {
          archived: false,
        },
      }
    );

    const historyDoc = {};
    if (history !== undefined) {
      historyDoc.history = history;
    }

    const box = await inventory.findOne({
      _id: new ObjectId(itemId),
    });

    console.log(box);

    await boxes.updateOne(
      {
        _id: new ObjectId(box.boxId),
      },
      {
        $push: historyDoc,
      }
    );

    return Response.json({
      success: true,
      message: "Reservation updated successfully",
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to update reservation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
