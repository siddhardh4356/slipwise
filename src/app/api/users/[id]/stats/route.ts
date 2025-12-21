import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import ExpenseSplit from '@/models/ExpenseSplit';
import Expense from '@/models/Expense';
import Group from '@/models/Group';

// GET /api/users/[id]/stats - Get user's spending statistics
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        await connectDB();

        // 1. Get all splits for this user
        // optimization: filter by date in query if possible, but expenses joining is needed first to check date.
        // Mongoose doesn't support joining for filtering in `find` easily.
        // We will fetch splits, and populate expenses.
        // Or aggregate.

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Aggregation to get relevant splits joined with expenses
        const splits = await ExpenseSplit.aggregate([
            { $match: { user_id: userId } },
            {
                $lookup: {
                    from: "expenses",
                    localField: "expense_id",
                    foreignField: "_id",
                    as: "expense"
                }
            },
            { $unwind: "$expense" },
            {
                $match: {
                    "expense.created_at": { $gte: sixMonthsAgo }
                }
            }
        ]);

        // Process for Monthly Spending
        const monthlyDataMap = new Map<string, number>();

        splits.forEach(split => {
            const date = new Date(split.expense.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const current = monthlyDataMap.get(monthKey) || 0;
            monthlyDataMap.set(monthKey, current + split.amount);
        });

        const monthlyData = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthName = d.toLocaleString('default', { month: 'short' });

            monthlyData.push({
                name: monthName,
                value: monthlyDataMap.get(monthKey) || 0
            });
        }

        // Process for By Group
        // We need group names. We can populate group in the previous aggregate or separate query.
        // Let's optimize: fetch group info for the splits we have.
        const groupIds = [...new Set(splits.map(s => s.expense.group_id))];
        const groups = await Group.find({ _id: { $in: groupIds } });
        const groupMap = new Map(groups.map(g => [g._id, g.name]));

        const groupByDataMap = new Map<string, number>();
        splits.forEach(split => {
            const groupName = groupMap.get(split.expense.group_id) || 'Unknown';
            const current = groupByDataMap.get(groupName) || 0;
            groupByDataMap.set(groupName, current + split.amount);
        });

        const groupData = Array.from(groupByDataMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Process for By Category (NEW)
        const categoryDataMap = new Map<string, number>();
        splits.forEach(split => {
            const category = split.expense.category || 'other';
            const current = categoryDataMap.get(category) || 0;
            categoryDataMap.set(category, current + split.amount);
        });

        const categoryData = Array.from(categoryDataMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({
            monthly: monthlyData,
            byGroup: groupData,
            byCategory: categoryData
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
