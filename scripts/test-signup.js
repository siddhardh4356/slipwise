// Test script to debug signup API
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simulate the User model
const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

async function testSignup() {
    const uri = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', uri ? uri.substring(0, 40) + '...' : 'NOT SET');

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected!');

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        const email = 'testapi' + Date.now() + '@slipwise.com';
        const password = 'password123';

        console.log('Checking if user exists...');
        const existing = await User.findOne({ email });
        console.log('Existing user:', existing);

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed');

        const userId = 'user-' + Date.now();
        console.log('Creating user with ID:', userId);

        const user = await User.create({
            _id: userId,
            name: 'Test User',
            email: email,
            password_hash: hashedPassword
        });

        console.log('User created successfully!');
        console.log('User ID:', user._id);
        console.log('User email:', user.email);

        await mongoose.connection.close();
        console.log('Done!');
        process.exit(0);

    } catch (error) {
        console.error('ERROR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testSignup();
