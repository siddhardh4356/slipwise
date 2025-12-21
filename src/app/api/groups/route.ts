import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { generateId } from '@/lib/utils';

// GET /api/groups - Get groups for current user
export async function GET() {
    try {
        // Get current user from auth session
        const { cookies } = await import('next/headers');
        const { verifyToken } = await import('@/lib/auth');
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = payload.userId;

        await connectDB();

        // Get group IDs where user is a member
        const memberships = await GroupMember.find({ user_id: userId });
        const groupIds = memberships.map(m => m.group_id);

        // Only fetch groups user is a member of
        const groups = await Group.find({ _id: { $in: groupIds } }).sort({ created_at: -1 });

        // Get members and expense count for each group
        const groupsWithMembers = await Promise.all(
            groups.map(async (group) => {
                const members = await GroupMember.find({ group_id: group._id }).populate({
                    path: 'user_id',
                    model: User,
                    select: 'id name email'
                });

                const expenseCount = await Expense.countDocuments({ group_id: group._id });

                return {
                    id: group._id, // map _id to id for frontend compatibility
                    name: group.name,
                    join_code: group.join_code,
                    joinCode: group.join_code, // Also add joinCode for frontend compatibility
                    created_by_id: group.created_by_id,
                    created_at: group.created_at,
                    members: members.map(m => {
                        const user = m.user_id as any;
                        if (!user) return null;
                        return {
                            user: {
                                id: user._id,
                                name: user.name,
                                email: user.email
                            }
                        };
                    }).filter(Boolean), // Remove null entries
                    _count: { expenses: expenseCount }
                };
            })
        );

        return NextResponse.json(groupsWithMembers);
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, memberIds } = body;

        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        if (!memberIds || memberIds.length === 0) {
            return NextResponse.json({ error: 'At least one member is required' }, { status: 400 });
        }

        await connectDB();

        const groupId = generateId();
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 char code
        const creatorId = memberIds[0]; // First member is creator

        // Create group
        const group = await Group.create({
            _id: groupId,
            name,
            join_code: joinCode,
            created_by_id: creatorId
        });

        // Add members
        const membersData = [];
        for (const userId of memberIds) {
            const memberId = generateId();
            await GroupMember.create({
                _id: memberId,
                user_id: userId,
                group_id: groupId
            });

            // Fetch user details for response
            const user = await User.findById(userId).select('id name email');
            if (user) {
                membersData.push({ user: { id: user._id, name: user.name, email: user.email } });
            }
        }

        return NextResponse.json({
            id: groupId,
            name,
            joinCode,
            members: membersData
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}
