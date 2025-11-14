import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = 'trackedInventory';

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
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export async function DELETE(request, { params }) {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);
        const { id } = await params;

        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid item ID format'
                },
                { status: 400 }
            );
        }

        // Check if item exists before deletion
        const existingItem = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingItem) {
            return Response.json(
                {
                    success: false,
                    error: 'Item not found'
                },
                { status: 404 }
            );
        }

        // Delete the document
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return Response.json(
                {
                    success: false,
                    error: 'Item could not be deleted'
                },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            message: 'Item deleted successfully',
            data: {
                deletedId: id,
                deletedItem: existingItem
            }
        });

    } catch (error) {
        console.error('DELETE error:', error);

        return Response.json(
            {
                success: false,
                error: 'Failed to delete item',
                details: error.message
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

        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return Response.json(
                {
                    success: false,
                    error: 'Invalid company ID format'
                },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Check if body is empty
        if (Object.keys(body).length === 0) {
            return Response.json(
                {
                    success: false,
                    error: 'No update data provided'
                },
                { status: 400 }
            );
        }


        // Prepare update document
        const updateDocument = {
            quantity: body.quantity,
            updatedAt: new Date()
        };


        // Update the document
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: updateDocument,
            }
        );

        if (result.matchedCount === 0) {
            return Response.json(
                {
                    success: false,
                    error: 'Item not found'
                },
                { status: 404 }
            );
        }

        if (result.modifiedCount === 0) {
            return Response.json(
                {
                    success: true,
                    message: 'No changes were made (data was identical)',
                    data: existingBox
                }
            );
        }

        // Return the updated document
        const updatedTracker = await collection.findOne({ _id: new ObjectId(id) });

        return Response.json({
            success: true,
            data: updatedTracker,
            message: 'Item updated successfully'
        });

    } catch (error) {
        console.error('PATCH error:', error);

        // Handle duplicate key error (if you have unique indexes)
        if (error.code === 11000) {
            return Response.json(
                {
                    success: false,
                    error: 'Duplicate entry',
                    details: 'An item with this information already exists'
                },
                { status: 409 }
            );
        }

        return Response.json(
            {
                success: false,
                error: 'Failed to update company',
                details: error.message
            },
            { status: 500 }
        );
    }
}