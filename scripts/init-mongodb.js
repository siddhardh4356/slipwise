// Script to initialize MongoDB collections and indexes
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL;

async function initializeDatabase() {
    console.log('Connecting to MongoDB...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas!');
        console.log('Database:', mongoose.connection.db.databaseName);

        const db = mongoose.connection.db;

        // Create collections if they don't exist
        const collections = ['users', 'groups', 'groupmembers', 'expenses', 'expensesplits', 'settlements', 'grouprequests'];

        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);

        for (const collName of collections) {
            if (!existingNames.includes(collName)) {
                await db.createCollection(collName);
                console.log(`Created collection: ${collName}`);
            } else {
                console.log(`Collection already exists: ${collName}`);
            }
        }

        // Create indexes
        console.log('\nCreating indexes...');

        // Users collection - email should be unique
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        console.log('Created unique index on users.email');

        // Groups collection - join_code should be unique
        await db.collection('groups').createIndex({ join_code: 1 }, { unique: true, sparse: true });
        console.log('Created unique index on groups.join_code');

        // GroupMembers collection - compound unique index for user+group
        await db.collection('groupmembers').createIndex({ user_id: 1, group_id: 1 }, { unique: true });
        console.log('Created unique compound index on groupmembers(user_id, group_id)');

        // Expenses collection - index on group_id for queries
        await db.collection('expenses').createIndex({ group_id: 1 });
        console.log('Created index on expenses.group_id');

        // ExpenseSplits collection - compound unique index and expense_id index
        await db.collection('expensesplits').createIndex({ expense_id: 1, user_id: 1 }, { unique: true });
        await db.collection('expensesplits').createIndex({ expense_id: 1 });
        console.log('Created indexes on expensesplits');

        // Settlements collection - index on group_id
        await db.collection('settlements').createIndex({ group_id: 1 });
        console.log('Created index on settlements.group_id');

        // GroupRequests collection - indexes for common queries
        await db.collection('grouprequests').createIndex({ group_id: 1 });
        await db.collection('grouprequests').createIndex({ user_id: 1 });
        await db.collection('grouprequests').createIndex({ status: 1 });
        console.log('Created indexes on grouprequests');

        console.log('\n✅ Database initialization complete!');

        // Show collection stats
        console.log('\nCollection document counts:');
        for (const collName of collections) {
            const count = await db.collection(collName).countDocuments();
            console.log(`  ${collName}: ${count} documents`);
        }

        await mongoose.connection.close();
        console.log('\nConnection closed.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

initializeDatabase();
