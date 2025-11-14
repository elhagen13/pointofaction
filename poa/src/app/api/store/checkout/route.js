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
 * Gets all boxes and 
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

        modifiedSaleInventory.push(modifiedItem)
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


export async function PATCH(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const boxes = db.collection("boxes")
    const descriptions = db.collection("descriptions")
    const sizes = db.collection("sizes")
    const brands = db.collection("brands")



    const { cart } = await request.json();

    const boxIds = cart.boxes?.map((id) => new ObjectId(id)) || []
    const itemIds = (cart.items && Object.keys(cart.items).map((id) => new ObjectId(id))) || []
    const boxLikeIds =(cart.boxLike?.map((item) => new ObjectId(item.itemId)) )|| []
    //get all inventory that have a matching boxId

    const boxedInventory = (cart.boxes && await collection.find({boxId: {$in: cart.boxes || []}}).toArray()) || []
    const addedInventory = await collection.find({_id: {$in: itemIds}}).toArray()
    const addedBoxes = await boxes.find({_id: {$in: boxIds}}).toArray()
    const addedBoxLike = await collection.find({_id: {$in: boxLikeIds }}).toArray()

    const descriptionCollection = await descriptions.find({}).toArray();
    const descriptionDict = {};
    descriptionCollection.forEach(item => descriptionDict[item._id] = item.description);


    const brandCollection = await brands.find({}).toArray();
    const brandDict = {}
    brandCollection.forEach(item => brandDict[item._id] = item.brand)

    const sizeCollection = await sizes.find({}).toArray()
    const sizeDict = {}
    sizeCollection.forEach(item => sizeDict[item._id] = item.size)

    console.log(boxedInventory, addedInventory, addedBoxes, addedBoxLike)

    const modifiedAddedInventory = []
    for(const item of addedInventory){
        let modifiedItem = {...item}
        if(modifiedItem.descriptionId) modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size"

        modifiedAddedInventory.push(modifiedItem)
    }
    const modifiedBoxedInventory = {}
    for(const item of boxedInventory){
        let modifiedItem = {...item}
        if(modifiedItem.descriptionId) modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size"

        if(!modifiedBoxedInventory[item.boxId])  modifiedBoxedInventory[item.boxId] = []
        
        modifiedBoxedInventory[item.boxId].push(modifiedItem)
    }

    const modifiedBoxedLikeInventory = []
    for(const item of addedBoxLike){
        let modifiedItem = {...item}
        if(modifiedItem.descriptionId) modifiedItem.description = descriptionDict[modifiedItem.descriptionId] || "No description"
        if(modifiedItem.brandId) modifiedItem.brand = brandDict[modifiedItem.brandId] || "No brand"
        if(modifiedItem.sizeId) modifiedItem.size = sizeDict[modifiedItem.sizeId] || "No size"

        modifiedBoxedLikeInventory.push(modifiedItem)
    }

    const modifiedBoxes = []
    for(const box of addedBoxes){
      let modifiedBox = {...box}
      modifiedBox["items"] = modifiedBoxedInventory[box._id]   
      let modifiedPrice = 0;
      for(const item of modifiedBoxedInventory[box._id]){
        modifiedPrice += parseFloat(item.price) * (item.quantity - (item.reserved || 0))
      } 
      modifiedBox.modifiedPrice = modifiedPrice - modifiedPrice * box.discount * 0.01
      modifiedBoxes.push(modifiedBox)
    }


    
    return Response.json({
      success: true,
      data: {
        added: modifiedAddedInventory,
        boxes: modifiedBoxes,
        boxLike: modifiedBoxedLikeInventory
      }
    });
  } catch(error) {
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
