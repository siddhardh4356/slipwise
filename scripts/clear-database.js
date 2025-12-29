// Script to clear all data from the MongoDB database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL;

async function clearDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get list of all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections found:', collections.map(c => c.name).join(', '));

        // Drop all collections
        for (const collection of collections) {
            console.log(`Deleting all documents from: ${collection.name}`);
            await mongoose.connection.db.collection(collection.name).deleteMany({});
            console.log(`  ✓ Cleared ${collection.name}`);
        }

        console.log('\n✅ All data has been successfully removed from the database!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

clearDatabase();
