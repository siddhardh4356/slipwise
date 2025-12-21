import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Settlement from '@/models/Settlement';
import User from '@/models/User';
import Group from '@/models/Group';
import { generateId } from '@/lib/utils';

// GET /api/settlements - Get all settlements
export async function GET() {
    try {
        await connectDB();

        const settlements = await Settlement.find().sort({ created_at: -1 })
            .populate({ path: 'from_user_id', model: User, select: 'id name email' })
            .populate({ path: 'to_user_id', model: User, select: 'id name email' })
            .populate({ path: 'group_id', model: Group, select: 'id name' });

        return NextResponse.json(settlements.map(s => {
            // @ts-ignore
            const from = s.from_user_id;
            // @ts-ignore
            const to = s.to_user_id;
            // @ts-ignore
            const group = s.group_id;

            return {
                id: s._id,
                amount: s.amount,
                createdAt: s.created_at,
                fromUser: from ? { id: from._id, name: from.name, email: from.email } : null,
                toUser: to ? { id: to._id, name: to.name, email: to.email } : null,
                group: group ? { id: group._id, name: group.name } : null
            };
        }));
    } catch (error) {
        console.error('Error fetching settlements:', error);
        return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
    }
}

// POST /api/settlements - Create a new settlement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromUserId, toUserId, amount, groupId } = body;

        // Validation
        if (!fromUserId || !toUserId || !amount || !groupId) {
            return NextResponse.json(
                { error: 'Missing required fields: fromUserId, toUserId, amount, groupId' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
        }

        if (fromUserId === toUserId) {
            return NextResponse.json({ error: 'Cannot settle with yourself' }, { status: 400 });
        }

        await connectDB();

        // Create settlement
        const id = generateId();
        await Settlement.create({
            _id: id,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            amount,
            group_id: groupId
        });

        // Fetch created settlement details for response
        const fromUser = await User.findById(fromUserId);
        const toUser = await User.findById(toUserId);

        return NextResponse.json({
            id,
            amount,
            fromUser: fromUser ? { id: fromUser._id, name: fromUser.name, email: fromUser.email } : null,
            toUser: toUser ? { id: toUser._id, name: toUser.name, email: toUser.email } : null,
            groupId
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating settlement:', error);
        return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
    }
}
