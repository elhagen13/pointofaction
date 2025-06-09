import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Helper function to generate array of dates between start and end date
function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we're working with valid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Generate array of dates
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export async function GET(request) {
  try {
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
    const { startDate, endDate, startTime, endTime, open, updatedAt = new Date().toISOString() } = body;

    if (!open || !startDate || !endDate || !startTime || !endTime) {
      return Response.json(
        { error: 'Missing required fields: open, startDate, endDate, startTime, endTime' },
        { status: 400 }
      );
    }

    // Generate array of dates between startDate and endDate
    let dateRange;
    try {
      dateRange = getDateRange(startDate, endDate);
    } catch (error) {
      return Response.json(
        { error: 'Invalid date range provided' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('test');
    const collection = db.collection('hours');

    const results = {
      created: [],
      updated: [],
      errors: []
    };

    // Process each date in the range
    for (const date of dateRange) {
      try {
        const existingHours = await collection.findOne({ date });
        
        if (existingHours) {
          // Update existing record
          const result = await collection.updateOne(
            { date },
            {
              $set: {
                startTime,
                endTime,
                open,
                updatedAt
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            results.updated.push({
              date,
              message: 'Hours updated successfully'
            });
          }
        } else {
          // Create new record
          const result = await collection.insertOne({
            date,
            startTime,
            endTime,
            open,
            createdAt: updatedAt,
            updatedAt
          });
          
          results.created.push({
            date,
            message: 'Hours created successfully',
            insertedId: result.insertedId
          });
        }
      } catch (dateError) {
        console.error(`Error processing date ${date}:`, dateError);
        results.errors.push({
          date,
          error: `Failed to process date: ${dateError.message}`
        });
      }
    }

    return Response.json({
      message: 'Batch operation completed',
      summary: {
        totalDates: dateRange.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: 'Failed to process hours' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}