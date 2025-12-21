import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import User from '@/models/User';
import GroupMember from '@/models/GroupMember';
import { generateId } from '@/lib/utils';

// POST /api/groups/[id]/members - Add a member to a group
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await connectDB();

        // Verify group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already a member
        const existing = await GroupMember.findOne({ user_id: userId, group_id: groupId });
        if (existing) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }

        const memberId = generateId();
        await GroupMember.create({
            _id: memberId,
            user_id: userId,
            group_id: groupId
        });

        return NextResponse.json({
            id: memberId,
            // @ts-ignore
            user: { id: user._id, name: user.name, email: user.email }
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}
