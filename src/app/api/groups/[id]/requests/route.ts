
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import GroupRequest from '@/models/GroupRequest';
import User from '@/models/User';

// GET /api/groups/[id]/requests - Get pending requests
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;

        await connectDB();

        const requests = await GroupRequest.find({ group_id: groupId, status: 'PENDING' })
            .populate({ path: 'user_id', model: User, select: 'id name email' });

        // Map to match previous structure if needed, or return as is.
        // Previous structure was flat: { id, user_id, name, email, created_at }
        // We will return a similar structure for compatibility
        const formattedRequests = requests.map(req => {
            // @ts-ignore
            const user = req.user_id;
            return {
                id: req._id,
                user_id: user?._id,
                name: user?.name,
                email: user?.email,
                created_at: req.created_at
            };
        });

        return NextResponse.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
