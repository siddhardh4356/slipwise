import mongoose from 'mongoose';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache;
}

if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
}

let cached = global.mongoose;

async function connectDB() {
    // Read the URI inside the function to ensure env vars are loaded
    const MONGODB_URI = process.env.DATABASE_URL;

    if (!MONGODB_URI) {
        console.error('DATABASE_URL is not defined in environment variables');
        throw new Error('Please define the DATABASE_URL environment variable inside .env');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log('Starting Mongoose connection...');
        console.log('Connecting to:', MONGODB_URI.substring(0, 30) + '...');
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('Mongoose connected successfully');
            return mongoose;
        }).catch(err => {
            console.error('Mongoose initial connection error:', err);
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;

