import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = "test";
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

// GET items by itemId
export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid item ID format",
        },
        { status: 400 }
      );
    }

    const items = await collection.find({ _id: new ObjectId(id) }).toArray();

    if (items.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No items found with this ID",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch items",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const { id } = await params;
    const { reservationDetails, status, soIn, orderTitle } = await request.json();

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: "Invalid reservation ID format" },
        { status: 400 }
      );
    }

    if (status || soIn || orderTitle) {
      const updateExisting = await collection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            ...(status && { status: status }),
            ...(soIn && { soIn: soIn }),
            ...(orderTitle && { orderTitle: orderTitle }),
          },
        }
      );
    }

    // Process each reservation detail
    if (reservationDetails) {
      for (const detail of reservationDetails) {
        const { itemId, newReserved } = detail;

        // Try to update existing item first
        const updateExisting = await collection.updateOne(
          {
            _id: new ObjectId(id),
            "items.itemId": itemId,
          },
          {
            $set: {
              "items.$.quantReserved": newReserved,
            },
          }
        );

        // If no existing item was updated, push new item
        if (updateExisting.matchedCount === 0) {
          await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $push: {
                items: {
                  itemId: itemId,
                  quantReserved: newReserved,
                },
              },
            }
          );
        }
      }
    }

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

export async function DELETE(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const brands = db.collection("brands");
    const sizes = db.collection("sizes");
    const inventory = db.collection("inventory");
    const { id } = await params;
    const { style, color, brand, size, quantityToRemove } =
      await request.json();

    console.log(style, color, brand, size, quantityToRemove);
    // Get brandId and sizeId if needed (await the promises!)
    let brandId = null;
    let sizeId = null;

    if (brand) {
      const brandDoc = await brands.findOne({ brand: brand });
      brandId = brandDoc?._id;
    }

    if (size) {
      const sizeDoc = await sizes.findOne({
        size: { $regex: size, $options: "i" },
      });
      sizeId = sizeDoc?._id;
    }

    const reservation = await collection.findOne({ _id: new ObjectId(id) });

    const ids = reservation.items.map((item) => new ObjectId(item.itemId));
    console.log(brandId, sizeId);
    console.log(ids);

    //find which objects in the reservation list have matching (style, color, brand, and size) && then
    //cycle through and remove however many needed to be removed
    const matchingObjects = await inventory
      .find({
        _id: { $in: ids },
        style: style,
        color: color,
        ...(brandId && { brandId: String(brandId) }),
        ...(sizeId && { sizeId: String(sizeId) }),
      })
      .toArray();

    const reservationItemDict = {};
    for (const item of reservation.items) {
      reservationItemDict[item.itemId] = {
        quantReserved: item.quantReserved,
        pulled: item.pulled,
      };
    }

    console.log("Reservation Item Dict:", reservationItemDict);

    // Sort by pulled quantity (ascending) - items with fewer pulled items first
    // Then by reserved quantity (ascending) - items with less reserved as secondary priority
    matchingObjects.sort((a, b) => {
      const aId = String(a._id);
      const bId = String(b._id);
      const aPulled = reservationItemDict[aId].pulled || 0;
      const bPulled = reservationItemDict[bId].pulled || 0;
      const aReserved = a.reserved || 0;
      const bReserved = b.reserved || 0;
      console.log("dkfjskfjdsl", "A:", a, aPulled, "B", b, bPulled);
      // Primary sort: fewer pulled items first
      if (aPulled !== bPulled) {
        return aPulled - bPulled;
      }
      // Secondary sort: fewer reserved items first (if pulled is equal)
      return aReserved - bReserved;
    });

    const matchingObjectDict = {};
    for (const item of matchingObjects) {
      matchingObjectDict[item._id] = item;
    }

    let quantity = quantityToRemove;
    const updatesForReservation = [];
    const updatesForInventory = [];
    console.log("Quantity:", quantity);

    // Process each matching object and reduce quantities
    // Now prioritizing items with fewer pulled items
    for (const matchingObj of matchingObjects) {
      console.log("Matching", matchingObj, "Pulled:", matchingObj.pulled || 0);
      if (quantity <= 0) break;

      const itemIdStr = String(matchingObj._id);
      const currentReserved = reservationItemDict[itemIdStr].quantReserved || 0;
      const currentPulled = reservationItemDict[itemIdStr].pulled;
      console.log("ItemIdStr: ", itemIdStr);
      console.log("Current Reserved:", currentReserved);
      console.log("Pulled:", matchingObj.pulled || 0);

      if (currentReserved > 0) {
        const toRemove = Math.min(quantity, currentReserved);
        const newReserved = currentReserved - toRemove;

        // Track the update for reservation
        updatesForReservation.push({
          itemId: itemIdStr,
          newQuantReserved: newReserved,
          reduceBy: toRemove,
        });

        // Track the update for inventory (reduce reserved amount)
        updatesForInventory.push({
          itemId: matchingObj._id,
          reduceBy: toRemove,
        });

        quantity -= toRemove;
        console.log(
          `Removing ${toRemove} from item with ${matchingObj.pulled || 0} pulled`
        );
      }
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: "Invalid reservation ID format" },
        { status: 400 }
      );
    }

    // Update reservation items
    for (const update of updatesForReservation) {
      if (update.newQuantReserved === 0) {
        // Remove the item from reservation if quantity becomes 0
        await collection.updateOne(
          { _id: new ObjectId(id) },
          {
            $pull: {
              items: { itemId: update.itemId },
            },
          }
        );
      } else {
        // Get current pulled amount from reservation
        const currentReservationItem = await collection.findOne({
          _id: new ObjectId(id),
          "items.itemId": update.itemId,
        });

        const currentReservationData = currentReservationItem.items.find(
          (item) => item.itemId === update.itemId
        );

        const currentPulled = currentReservationData?.pulled || 0;

        // Logic: If new reserved amount is less than current pulled,
        // set pulled equal to new reserved amount
        const newPulled = Math.min(currentPulled, update.newQuantReserved);

        await collection.updateOne(
          {
            _id: new ObjectId(id),
            "items.itemId": update.itemId,
          },
          {
            $set: {
              "items.$.quantReserved": update.newQuantReserved,
              "items.$.pulled": newPulled,
            },
          }
        );
      }
    }

    // Update inventory items (reduce reserved quantities)
    for (const update of updatesForInventory) {
      const currentItem = await inventory.findOne({ _id: update.itemId });
      const newReserved = Math.max(
        0,
        (currentItem.reserved || 0) - update.reduceBy
      );

      await inventory.updateOne(
        { _id: update.itemId },
        {
          $set: {
            reserved: newReserved,
          },
        }
      );
    }

    return Response.json({
      success: true,
      message: "Reservation updated successfully",
      removedQuantity: quantityToRemove - quantity,
      remainingToRemove: quantity,
    });
  } catch (error) {
    console.error("DELETE error:", error);
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
