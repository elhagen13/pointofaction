import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    // SAFER WAY TO GET QUERY PARAMETERS
    let date;
    try {
      const url = new URL(request.url);
      date = url.searchParams.get('date');
    } catch (error) {
      console.error('Error parsing URL:', error);
      return Response.json(
        { error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('test');
    const collection = db.collection('hours');

    if (date) {
      const hours = await collection.findOne({ date });
      
      if (!hours) {
        return Response.json(
          { error: 'Hours not found for the specified date' },
          { status: 404 }
        );
      }
      
      return Response.json(hours);
    } else {
      const allHours = await collection.find({}).sort({ date: 1 }).toArray();
      return Response.json(allHours);
    }

  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: 'Failed to fetch hours' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, updatedAt = new Date().toISOString() } = body;

    if (!date || !startTime || !endTime) {
      return Response.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('test');
    const collection = db.collection('hours');

    const existingHours = await collection.findOne({ date });

    if (existingHours) {
      const result = await collection.updateOne(
        { date },
        {
          $set: {
            startTime,
            endTime,
            updatedAt
          }
        }
      );
      
      return Response.json({
        message: 'Hours updated successfully',
        modifiedCount: result.modifiedCount
      });
    } else {
      const result = await collection.insertOne({
        date,
        startTime,
        endTime,
        createdAt: updatedAt,
        updatedAt
      });

      return Response.json({
        message: 'Hours created successfully',
        insertedId: result.insertedId
      });
    }

  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: 'Failed to update hours' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}