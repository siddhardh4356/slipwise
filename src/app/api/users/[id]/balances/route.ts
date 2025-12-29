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

        // Calculate across all groups
        for (const membership of memberships) {
            const groupId = membership.group_id;

            // Get all expenses in this group
            const expensesInGroup = await Expense.find({ group_id: groupId });
            const expenseIdsPaidByOthers = expensesInGroup.filter(e => e.paid_by_id !== userId).map(e => e._id);
            const expenseIdsPaidByUser = expensesInGroup.filter(e => e.paid_by_id === userId).map(e => e._id);

            // What this user owes (expenses paid by others, where user has a split)
            const splitsOwedByUser = await ExpenseSplit.find({
                user_id: userId,
                expense_id: { $in: expenseIdsPaidByOthers }
            });
            const rawOwes = splitsOwedByUser.reduce((sum, split) => sum + Number(split.amount), 0);

            // What user is owed (expenses paid by user, splits for others)
            const splitsOwedToUser = await ExpenseSplit.find({
                user_id: { $ne: userId },
                expense_id: { $in: expenseIdsPaidByUser }
            });
            const rawOwed = splitsOwedToUser.reduce((sum, split) => sum + Number(split.amount), 0);

            // Get settlements - settlements affect NET position
            const settlementsOut = await Settlement.find({ from_user_id: userId, group_id: groupId });
            const settledOut = settlementsOut.reduce((sum, s) => sum + Number(s.amount), 0);

            const settlementsIn = await Settlement.find({ to_user_id: userId, group_id: groupId });
            const settledIn = settlementsIn.reduce((sum, s) => sum + Number(s.amount), 0);

            // Calculate net for this group:
            // Net = (what they owe me - what I received) - (what I owe them - what I paid)
            // Positive means they owe me, negative means I owe them
            const groupNetOwed = rawOwed - settledIn;  // What's still owed to me after receiving payments
            const groupNetOwes = rawOwes - settledOut; // What I still owe after paying

            // Accumulate - but handle when settlements exceed the debt
            if (groupNetOwed > 0) {
                totalOwed += groupNetOwed;
            } else {
                // I received more than owed - this means I over-received, effectively I owe this back
                totalOwes += Math.abs(groupNetOwed);
            }

            if (groupNetOwes > 0) {
                totalOwes += groupNetOwes;
            } else {
                // I paid more than owed - this means I'm owed this excess
                totalOwed += Math.abs(groupNetOwes);
            }
        }

        // Round final values
        const finalOwes = Math.round(totalOwes * 100) / 100;
        const finalOwed = Math.round(totalOwed * 100) / 100;

        return NextResponse.json({
            userId,
            userName: user.name,
            totalOwes: finalOwes,
            totalOwed: finalOwed,
            netBalance: Math.round((finalOwed - finalOwes) * 100) / 100
        });
    } catch (error) {
        console.error('Error fetching user balances:', error);
        return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }
}
