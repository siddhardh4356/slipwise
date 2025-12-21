
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import GroupRequest from '@/models/GroupRequest';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const { code, userId } = await request.json(); // userId from body for now, ideally from auth session

        if (!code || !userId) {
            return NextResponse.json({ error: 'Missing code or user' }, { status: 400 });
        }

        await connectDB();

        // Find group by code
        const group = await Group.findOne({ join_code: code });

        if (!group) {
            return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
        }

        // Check if request already exists
        const existingRequest = await GroupRequest.findOne({
            group_id: group._id,
            user_id: userId,
            status: 'PENDING'
        });

        if (existingRequest) {
            return NextResponse.json({ message: 'Request already sent', group: { id: group._id, name: group.name } });
        }

        const requestId = generateId();
        await GroupRequest.create({
            _id: requestId,
            group_id: group._id,
            user_id: userId,
            status: 'PENDING'
        });

        return NextResponse.json({ message: 'Request sent to admin', group: { id: group._id, name: group.name } });

    } catch (error) {
        console.error('Join error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
