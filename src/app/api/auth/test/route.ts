import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    const results: string[] = [];

    try {
        results.push('1. Starting test');

        const body = await request.json();
        results.push('2. Body parsed: ' + JSON.stringify(body));

        results.push('3. Connecting to DB...');
        await connectDB();
        results.push('4. Connected to DB');

        const count = await User.countDocuments();
        results.push('5. User count: ' + count);

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        results.push('ERROR: ' + error.message);
        return NextResponse.json({
            success: false,
            results,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
