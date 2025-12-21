import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Expense from '@/models/Expense';
import Settlement from '@/models/Settlement';
import User from '@/models/User';

interface Transaction {
    id: string;
    type: 'expense' | 'settlement';
    description: string;
    amount: number;
    fromUser?: { id: string; name: string };
    toUser?: { id: string; name: string };
    paidBy?: { id: string; name: string };
    category?: string;
    createdAt: Date;
}

// GET /api/groups/[id]/transactions - Get all transactions (expenses + settlements) for a group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;

        await connectDB();

        // Fetch expenses
        const expenses = await Expense.find({ group_id: groupId })
            .sort({ created_at: -1 });

        // Fetch settlements
        const settlements = await Settlement.find({ group_id: groupId })
            .sort({ created_at: -1 });

        // Get all user IDs involved
        const userIds = new Set<string>();
        expenses.forEach(e => userIds.add(e.paid_by_id));
        settlements.forEach(s => {
            userIds.add(s.from_user_id);
            userIds.add(s.to_user_id);
        });

        // Fetch user details
        const users = await User.find({ _id: { $in: Array.from(userIds) } });
        const userMap = new Map(users.map(u => [u._id, { id: u._id, name: u.name }]));

        // Build transactions array
        const transactions: Transaction[] = [];

        // Add expenses
        expenses.forEach(expense => {
            const paidByUser = userMap.get(expense.paid_by_id);
            transactions.push({
                id: expense._id,
                type: 'expense',
                description: expense.description,
                amount: expense.amount,
                paidBy: paidByUser || { id: expense.paid_by_id, name: 'Unknown' },
                category: expense.category,
                createdAt: expense.created_at
            });
        });

        // Add settlements
        settlements.forEach(settlement => {
            const fromUser = userMap.get(settlement.from_user_id);
            const toUser = userMap.get(settlement.to_user_id);
            transactions.push({
                id: settlement._id,
                type: 'settlement',
                description: `${fromUser?.name || 'Someone'} paid ${toUser?.name || 'someone'}`,
                amount: settlement.amount,
                fromUser: fromUser || { id: settlement.from_user_id, name: 'Unknown' },
                toUser: toUser || { id: settlement.to_user_id, name: 'Unknown' },
                createdAt: settlement.created_at
            });
        });

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(transactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
