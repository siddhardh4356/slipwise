import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { generateId } from '@/lib/utils';

// GET /api/groups/[id] - Get a specific group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await connectDB();

        const group = await Group.findById(id);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Get members
        const members = await GroupMember.find({ group_id: id }).populate({
            path: 'user_id',
            model: User,
            select: 'id name email'
        });

        // Get expenses (without complex joins, we can populate)
        const expenses = await Expense.find({ group_id: id }).sort({ created_at: -1 }).populate({
            path: 'paid_by_id',
            model: User,
            select: 'id name email'
        });

        return NextResponse.json({
            id: group._id,
            name: group.name,
            created_at: group.created_at,
            members: members.map(m => {
                // @ts-ignore
                const user = m.user_id;
                return {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email
                    }
                };
            }),
            expenses: expenses.map(e => {
                // @ts-ignore
                const payer = e.paid_by_id;
                return {
                    id: e._id,
                    description: e.description,
                    amount: e.amount,
                    splitType: e.split_type,
                    paidBy: { id: payer._id, name: payer.name, email: payer.email },
                    createdAt: e.created_at
                };
            })
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await connectDB();
        await Group.deleteOne({ _id: id });
        // Cascade DELETE is not automatic in Mongoose unless middleware is set up. 
        // For now, we manually delete related data or rely on logic elswhere. 
        // Strict relational integrity is harder in NoSQL. 
        // We will just delete the group for now. 
        // Ideally: Delete GroupMembers, Expenses, ExpenseSplits, Settlements related to this group.

        await GroupMember.deleteMany({ group_id: id });
        await Expense.deleteMany({ group_id: id });
        // ExpenseSplits need expense IDs to delete. 
        // ...

        return NextResponse.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}
