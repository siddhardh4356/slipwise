import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import GroupMember from '@/models/GroupMember';
import Expense from '@/models/Expense';
import ExpenseSplit from '@/models/ExpenseSplit';
import Settlement from '@/models/Settlement';

// GET /api/users/[id]/balances - Get user's balance summary
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        await connectDB();

        // Get user info
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all groups the user is in
        const memberships = await GroupMember.find({ user_id: userId });

        let totalOwes = 0;
        let totalOwed = 0;

        // Efficiently fetch all relevant data could replace loop, but let's mirror logic for correctness first.
        for (const membership of memberships) {
            const groupId = membership.group_id;

            // 1. Get all expenses in this group
            // We need to know which expenses in this group are paid by whom.
            const expensesInGroup = await Expense.find({ group_id: groupId });
            const expenseIds = expensesInGroup.map(e => e._id);
            const expenseIdsPaidByOthers = expensesInGroup.filter(e => e.paid_by_id !== userId).map(e => e._id);
            const expenseIdsPaidByUser = expensesInGroup.filter(e => e.paid_by_id === userId).map(e => e._id);

            // What this user owes (expenses paid by others, where user has a split)
            const splitsOwedByUser = await ExpenseSplit.find({
                user_id: userId,
                expense_id: { $in: expenseIdsPaidByOthers }
            });
            const owes = splitsOwedByUser.reduce((sum, split) => sum + split.amount, 0);

            // What user is owed (expenses paid by user, splits for others)
            const splitsOwedToUser = await ExpenseSplit.find({
                user_id: { $ne: userId },
                expense_id: { $in: expenseIdsPaidByUser }
            });
            const owed = splitsOwedToUser.reduce((sum, split) => sum + split.amount, 0);

            // Subtract settlements
            const settlementsOut = await Settlement.find({ from_user_id: userId, group_id: groupId });
            const settledOut = settlementsOut.reduce((sum, s) => sum + s.amount, 0);

            const settlementsIn = await Settlement.find({ to_user_id: userId, group_id: groupId });
            const settledIn = settlementsIn.reduce((sum, s) => sum + s.amount, 0);

            totalOwes += owes - settledOut;
            totalOwed += owed - settledIn;
        }

        return NextResponse.json({
            userId,
            userName: user.name,
            totalOwes: Math.max(0, Math.round(totalOwes * 100) / 100),
            totalOwed: Math.max(0, Math.round(totalOwed * 100) / 100),
            netBalance: Math.round((totalOwed - totalOwes) * 100) / 100
        });
    } catch (error) {
        console.error('Error fetching user balances:', error);
        return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }
}
