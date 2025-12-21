import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import GroupRequest from '@/models/GroupRequest';
import User from '@/models/User';

// GET /api/users/[id]/pending-requests - Get pending requests for groups user is admin of
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        await connectDB();

        // Find all groups where user is the creator (admin)
        const adminGroups = await Group.find({ created_by_id: userId });
        const groupIds = adminGroups.map(g => g._id);

        if (groupIds.length === 0) {
            return NextResponse.json({ count: 0, requests: [] });
        }

        // Find all pending requests for these groups
        const pendingRequests = await GroupRequest.find({
            group_id: { $in: groupIds },
            status: 'PENDING'
        }).sort({ created_at: -1 });

        // Get user details and group names for each request
        const requestsWithDetails = await Promise.all(
            pendingRequests.map(async (req) => {
                const user = await User.findById(req.user_id).select('name email');
                const group = adminGroups.find(g => g._id === req.group_id);

                return {
                    id: req._id,
                    user_id: req.user_id,
                    name: user?.name || 'Unknown',
                    email: user?.email || '',
                    group_id: req.group_id,
                    group_name: group?.name || 'Unknown Group',
                    created_at: req.created_at
                };
            })
        );

        return NextResponse.json({
            count: pendingRequests.length,
            requests: requestsWithDetails
        });

    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 });
    }
}
