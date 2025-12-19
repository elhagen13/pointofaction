import { MongoClient, ObjectId } from "mongodb";

// MongoDB connection string - replace with your actual connection string
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

// Get next sequential ID
  async function getNextSequenceId(sequenceName) {
    const { db } = await connectToDatabase();
    const counters = db.collection('counters');
    
    const result = await counters.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    
    return result.sequence_value;
  }


export async function PATCH(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const boxes = db.collection("boxes")
    const descriptions = db.collection("descriptions")
    const sizes = db.collection("sizes")
    const brands = db.collection("brands")
    
    const sequentialId = await getNextSequenceId('reservation');




    const { cart, customer } = await request.json();
    console.log("CART", cart)
    console.log("CUSTOMER", customer)

    const itemObjectIds = (cart.items && Object.keys(cart.items).map((id) => new ObjectId(id))) || []
    const boxedLikeInventoryIds = (cart.boxLike && cart.boxLike.map((item) => new ObjectId(item.itemId))) || []
    //get all inventory that have a matching boxId
    
    const boxInventory = (cart.boxes && await collection.find({boxId: {$in: cart.boxes}}).toArray())|| []
    const addedInventory = await collection.find({_id: {$in: itemObjectIds}}).toArray()

    const boxLikeInventory = await collection.find({_id: {$in: boxedLikeInventoryIds}}).toArray()

    const boxedInventory = boxInventory.concat(boxLikeInventory)
    console.log(boxedInventory)


    /**
     * Tasks: 
     *      For each item inside a box, mark reserved to be equal to the quantity
     *      For each added item, increase the reserved to be equal to the reservation amount
     *      Create a reservation, should be like the internal reservation, but include a boxes field 
     *      which has an array of the ids of the items in that box
     */

    const boxedInventoryIds = boxedInventory.map((item) => new ObjectId(item._id))

    await collection.updateMany({_id : {$in: boxedInventoryIds}}, 
        [
            {$set: {reserved: "$quantity"}}
        ]
    )

    const bulkOps = Object.entries(cart.items).map(([id, quantity]) => ({
        updateOne: {
            filter: {_id: new ObjectId(id)},
            update: { $inc: {reserved: quantity}}
        }
    }))

    if(Object.keys(cart.items).length > 0) collection.bulkWrite(bulkOps)


    const descriptionCollection = await descriptions.find({}).toArray();
    const descriptionDict = {};
    descriptionCollection.forEach(item => descriptionDict[item._id] = item.description);


    const brandCollection = await brands.find({}).toArray();
    const brandDict = {}
    brandCollection.forEach(item => brandDict[item._id] = item.brand)

    const sizeCollection = await sizes.find({}).toArray()
    const sizeDict = {}
    sizeCollection.forEach(item => sizeDict[item._id] = item.size)

    console.log("ADDED", addedInventory)
    let totalInventory = []
    for(const item of addedInventory){
        let modifiedItem = {...item}
        modifiedItem.itemId = String(item._id)
        if(modifiedItem.descriptionId) modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size",
        modifiedItem.quantReserved = cart.items[item._id]
        modifiedItem.pulled = 0
        totalInventory.push(modifiedItem)
    }

    let boxedIds = []
    console.log("BOXED", boxedInventory)

    for(const item of boxedInventory){
        let modifiedItem = {...item}
        modifiedItem.itemId = String(item._id)
        modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size",
        modifiedItem.quantReserved = modifiedItem.quantity - (modifiedItem.reserved || 0)
        modifiedItem.pulled = 0
        totalInventory.push(modifiedItem)
        boxedIds.push(String(item._id))
    }


    const reservationItem = {
        sequentialId: sequentialId,
        orderTitle: "Customer purchase",
        soIn: "",
        items: totalInventory,
        boxedIds: boxedIds,
        boxIds: cart.boxes,
        status: "Incomplete",
        internal: false,
        customer: customer,
        createdAt: new Date(),
        updatedAt: new Date(),

    }

    const result = await db.collection("reservations").insertOne(reservationItem)

    
    return Response.json({
      success: true,
      data: result
  
    });
  } catch(error) {
    console.log(error)
    return Response.json(
      {
        success: false,
        error: "Failed to update visibility",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
