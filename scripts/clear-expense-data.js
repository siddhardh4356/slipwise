// Script to clear expense-related data (Expenses, ExpenseSplits, Settlements)
// while preserving Users and Groups for testing
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL;

async function clearExpenseData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear expense-related collections only
        const collectionsToClean = ['expenses', 'expensesplits', 'settlements'];

        // Get list of all collections
        const allCollections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = allCollections.map(c => c.name.toLowerCase());

        console.log('\nExisting collections:', collectionNames.join(', '));
        console.log('\nClearing expense-related data...');

        for (const collName of collectionsToClean) {
            if (collectionNames.includes(collName.toLowerCase())) {
                const result = await mongoose.connection.db.collection(collName).deleteMany({});
                console.log(`  ✓ Cleared ${collName}: ${result.deletedCount} documents deleted`);
            } else {
                console.log(`  - Collection '${collName}' not found, skipping`);
            }
        }

        console.log('\n✅ Expense data cleared! Users and Groups preserved.');
        console.log('You can now test with fresh expenses and settlements.\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

clearExpenseData();
