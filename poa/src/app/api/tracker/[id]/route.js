import { MongoClient } from "mongodb";
import { cookies } from "next/headers";

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = "tracker";

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
    const p = await params;
    const body = await request.json();

    let page;
    switch (p.id) {
      case "Home":
        page = "home";
        break;
      case "Company Stores":
        page = "company_stores";
        break;
      case "Services":
        page = "services";
        break;
      case "Vendors":
        page = "vendors";
        break;
      case "Contact Us":
        page = "contact";
        break;
      case "Gallery":
        page = "gallery";
        break;
      default:
        break;
    }

    const today = new Date(body.endDate);
    const startDate = new Date(body.startDate);
    console.log(today, startDate);
    // Generate complete date range
    const dateRange = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(currentDate, startDate);
    // Get MongoDB results
    const result = await collection
      .aggregate([
        {
          $match: {
            page: page,
            timestamp: {
              $gte: startDate,
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: "$timestamp",
                unit: "day",
              },
            },
            totalDocuments: { $sum: 1 },
            firstVisitThisMonthCount: {
              $sum: {
                $cond: [{ $eq: ["$firstVisitThisMonth", true] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalDocuments: 1,
            firstVisitThisMonthCount: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ])
      .toArray();

    // Create a map of results for easy lookup
    const resultMap = new Map(
      result.map((item) => [
        new Date(item.date).toISOString().split("T")[0],
        item,
      ])
    );

    // Merge date range with results
    const completeData = dateRange.map((date) => {
      const dateKey = date.toISOString().split("T")[0];
      const existingData = resultMap.get(dateKey);

      return (
        existingData || {
          date: date,
          totalDocuments: 0,
          firstVisitThisMonthCount: 0,
        }
      );
    });

    const response = Response.json({
      success: true,
      data: completeData,
    });

    return response;
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}
