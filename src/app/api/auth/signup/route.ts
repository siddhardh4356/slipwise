
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { generateId } from '@/lib/utils';
import { hashPassword, signToken, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    console.log('=== SIGNUP START ===');
    try {
        const body = await request.json();
        console.log('Body received:', JSON.stringify(body));
        const { name, email, password } = body;

        if (!name || !email || !password) {
            console.log('Missing fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('Connecting to DB...');
        try {
            await connectDB();
            console.log('DB Connected!');
        } catch (dbError: any) {
            console.error('DB Connection Error:', dbError.message);
            return NextResponse.json({
                error: 'Database connection failed',
                details: dbError.message
            }, { status: 500 });
        }

        // Check if user exists
        console.log('Checking for existing user...');
        const existingUser = await User.findOne({ email });
        console.log('Existing user:', existingUser ? 'yes' : 'no');

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await hashPassword(password);
        const userId = generateId();
        console.log('Creating user:', userId);

        // Create user
        try {
            await User.create({
                _id: userId,
                name,
                email,
                password_hash: hashedPassword
            });
            console.log('User created successfully');
        } catch (createError: any) {
            console.error('User creation error:', createError.message);
            return NextResponse.json({
                error: 'Failed to create user',
                details: createError.message
            }, { status: 500 });
        }

        // Create session
        console.log('Creating session...');
        const token = await signToken({ id: userId, email, name });
        await setSession(token);
        console.log('Session created');

        console.log('=== SIGNUP SUCCESS ===');
        return NextResponse.json({
            user: { id: userId, name, email }
        }, { status: 201 });

    } catch (error: any) {
        console.error('=== SIGNUP ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

