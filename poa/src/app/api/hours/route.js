// pages/api/hours.js (for Next.js Pages Router)
// or app/api/hours/route.js (for Next.js App Router)

import { MongoClient } from 'mongodb';

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// For App Router (app/api/hours/route.js)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    await client.connect();
    const db = client.db('test'); // Replace with your DB name
    const collection = db.collection('hours'); // Replace with your collection name

    if (date) {
      // Get hours for specific date
      const hours = await collection.findOne({ date });
      
      if (!hours) {
        return Response.json(
          { error: 'Hours not found for the specified date' },
          { status: 404 }
        );
      }
      
      return Response.json(hours);
    } else {
      // Get all hours, sorted by date
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
    const { date, startTime, endTime, updatedAt } = body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return Response.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('test'); // Replace with your DB name
    const collection = db.collection('hours'); // Replace with your collection name

    // Check if hours for this date already exist
    const existingHours = await collection.findOne({ date });

    if (existingHours) {
      // Update existing entry
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
      // Create new entry
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

// For Pages Router (pages/api/hours.js)
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { date } = req.query;

      await client.connect();
      const db = client.db('test'); // Replace with your DB name
      const collection = db.collection('hours'); // Replace with your collection name

      if (date) {
        // Get hours for specific date
        const hours = await collection.findOne({ date });
        
        if (!hours) {
          return res.status(404).json({
            error: 'Hours not found for the specified date'
          });
        }
        
        return res.status(200).json(hours);
      } else {
        // Get all hours, sorted by date
        const allHours = await collection.find({}).sort({ date: 1 }).toArray();
        return res.status(200).json(allHours);
      }

    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch hours' });
    } finally {
      await client.close();
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { date, startTime, endTime, updatedAt } = req.body;

      // Validate required fields
      if (!date || !startTime || !endTime) {
        return res.status(400).json({
          error: 'Missing required fields: date, startTime, endTime'
        });
      }

      await client.connect();
      const db = client.db('test'); // Replace with your DB name
      const collection = db.collection('hours'); // Replace with your collection name

      // Check if hours for this date already exist
      const existingHours = await collection.findOne({ date });

      if (existingHours) {
        // Update existing entry
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
        
        return res.status(200).json({
          message: 'Hours updated successfully',
          modifiedCount: result.modifiedCount
        });
      } else {
        // Create new entry
        const result = await collection.insertOne({
          date,
          startTime,
          endTime,
          createdAt: updatedAt,
          updatedAt
        });

        return res.status(201).json({
          message: 'Hours created successfully',
          insertedId: result.insertedId
        });
      }

    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update hours' });
    } finally {
      await client.close();
    }
  } 
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}