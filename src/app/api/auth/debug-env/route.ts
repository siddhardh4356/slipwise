import { NextResponse } from 'next/server';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL;
    return NextResponse.json({
        hasUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 15) + '...' : 'none',
        nodeEnv: process.env.NODE_ENV
    });
}
