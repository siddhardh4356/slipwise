
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import GroupRequest from '@/models/GroupRequest';
import GroupMember from '@/models/GroupMember';
import { generateId } from '@/lib/utils';

// POST /api/requests/[id]/action - Approve or Reject
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params;
        const { action } = await request.json(); // 'APPROVE' or 'REJECT'

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await connectDB();

        // Get request details
        const req = await GroupRequest.findById(requestId);

        if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        if (action === 'APPROVE') {
            // Add to members
            // Check existence first
            const existingMember = await GroupMember.findOne({ user_id: req.user_id, group_id: req.group_id });

            if (!existingMember) {
                const memberId = generateId();
                await GroupMember.create({
                    _id: memberId,
                    user_id: req.user_id,
                    group_id: req.group_id
                });
            }

            // Update status
            req.status = 'APPROVED';
            await req.save();
        } else {
            req.status = 'REJECTED';
            await req.save();
        }

        return NextResponse.json({ message: `Request ${action}D` });

    } catch (error) {
        console.error('Action error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
