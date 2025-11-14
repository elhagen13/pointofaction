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

/** 
 * Gets all items and boxes that have been marked as sale items
*/
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const boxCollection = db.collection("boxes");
    const descriptions = db.collection("descriptions");
    const sizes = db.collection("sizes");
    const brands = db.collection("brands")
    
    
    // Step 1: Get all inventory items first, that have been marked as sale
    const saleInventory = await collection.find({sale: true, archived: {$in: [null, false]}}).toArray();

    const boxIds = new Set();
    const descriptionIds = new Set();
    const brandIds = new Set();
    const sizeIds = new Set();
    
    saleInventory.forEach((inventory) => {
        boxIds.add(new ObjectId(inventory.boxId));
        inventory.descriptionId && descriptionIds.add(new ObjectId(inventory.descriptionId));
        inventory.brandId && brandIds.add(new ObjectId(inventory.brandId));
        inventory.sizeId && sizeIds.add(new ObjectId(inventory.sizeId));
    })

    const descriptionIdArray = Array.from(descriptionIds);
    const descriptionCollection = await descriptions.find({_id : {$in : descriptionIdArray}}).toArray();
    const descriptionDict = {};
    descriptionCollection.forEach(item => descriptionDict[item._id] = item.description);


    const brandIdArray = Array.from(brandIds);
    const brandCollection = await brands.find({_id : {$in : brandIdArray}}).toArray();
    const brandDict = {}
    brandCollection.forEach(item => brandDict[item._id] = item.brand)

    const sizeIdArray = Array.from(sizeIds)
    const sizeCollection = await sizes.find({_id : {$in : sizeIdArray}}).toArray()
    const sizeDict = {}
    sizeCollection.forEach(item => sizeDict[item._id] = item.size)


    //Step 2: for each item, add fields as needed
    const modifiedSaleInventory = []
    for(const item of saleInventory){
        let modifiedItem = {...item}
        if(modifiedItem.descriptionId) modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size"
        if(modifiedItem.reserved && modifiedItem.reserved > 0){
          modifiedItem.quantity = modifiedItem.quantity - item.reserved
          delete modifiedItem.reserved
        }    
        
        if(modifiedItem.quantity > 0){
          modifiedSaleInventory.push(modifiedItem)
        }
          
    }
    


    const boxIdArray = Array.from(boxIds)
    const saleBoxes = await boxCollection.find({_id : {$in: boxIdArray}}).toArray()
   
      
    return Response.json({
      success: true,
      data: {
        inventory: modifiedSaleInventory,
        boxes: saleBoxes

      }
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
