import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import ExpenseSplit from '@/models/ExpenseSplit';
import Settlement from '@/models/Settlement';
import User from '@/models/User';

interface Balance {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
}

// GET /api/groups/[id]/balances - Get all balances in a group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;

        await connectDB();

        // Verify group exists
        const group = await Group.findById(groupId);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        const balances = await calculateGroupBalances(groupId);

        return NextResponse.json({
            groupId,
            groupName: group.name,
            balances
        });
    } catch (error) {
        console.error('Error fetching group balances:', error);
        return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }
}

async function calculateGroupBalances(groupId: string): Promise<Balance[]> {
    // Get all expenses
    const expenses = await Expense.find({ group_id: groupId }).populate({ path: 'paid_by_id', model: User, select: 'name' });

    // Get expense IDs to fetch splits
    const expenseIds = expenses.map(e => e._id);

    // Get all splits for these expenses
    const allSplits = await ExpenseSplit.find({ expense_id: { $in: expenseIds } }).populate({ path: 'user_id', model: User, select: 'name' });

    // Get all settlements
    const settlements = await Settlement.find({ group_id: groupId })
        .populate({ path: 'from_user_id', model: User, select: 'name' })
        .populate({ path: 'to_user_id', model: User, select: 'name' });

    // Build net balances map
    const netBalances = new Map<string, number>();
    const userNames = new Map<string, string>();

    // Map splits by expense ID for easier access
    const splitsByExpense = new Map<string, any[]>();
    allSplits.forEach(split => {
        const eid = split.expense_id.toString();
        if (!splitsByExpense.has(eid)) splitsByExpense.set(eid, []);
        splitsByExpense.get(eid)!.push(split);
    });

    for (const expense of expenses) {
        const payer = expense.paid_by_id as any;
        const payerId = payer._id?.toString() || expense.paid_by_id.toString();
        userNames.set(payerId, payer.name);

        const splits = splitsByExpense.get(expense._id.toString()) || [];

        for (const split of splits) {
            const splitUser = split.user_id as any;
            const splitUserId = splitUser._id?.toString() || split.user_id.toString();
            if (splitUserId === payerId) continue;

            userNames.set(splitUserId, splitUser.name);

            const key = `${splitUserId}->${payerId}`;
            const reverseKey = `${payerId}->${splitUserId}`;

            if (netBalances.has(reverseKey)) {
                const current = netBalances.get(reverseKey)!;
                if (current > split.amount) {
                    netBalances.set(reverseKey, current - Number(split.amount));
                } else if (current < split.amount) {
                    netBalances.delete(reverseKey);
                    netBalances.set(key, Number(split.amount) - current);
                } else {
                    netBalances.delete(reverseKey);
                }
            } else {
                const current = netBalances.get(key) || 0;
                netBalances.set(key, current + Number(split.amount));
            }
        }
    }
    // Apply settlements to net balances
    for (const settlement of settlements) {
        const fromUser = settlement.from_user_id as any;
        const toUser = settlement.to_user_id as any;
        const fromId = fromUser._id?.toString() || settlement.from_user_id.toString();
        const toId = toUser._id?.toString() || settlement.to_user_id.toString();

        userNames.set(fromId, fromUser.name);
        userNames.set(toId, toUser.name);

        const key = `${fromId}->${toId}`;
        const reverseKey = `${toId}->${fromId}`;
        const settlementAmount = Number(settlement.amount);

        if (netBalances.has(key)) {
            // From owes To (matching direction): settlement reduces what From owes
            const current = netBalances.get(key)!;
            if (current > settlementAmount) {
                netBalances.set(key, current - settlementAmount);
            } else if (current < settlementAmount) {
                // Over-settlement: From paid more than they owed, so now To owes From the excess
                netBalances.delete(key);
                const excess = settlementAmount - current;
                const existingReverse = netBalances.get(reverseKey) || 0;
                netBalances.set(reverseKey, existingReverse + excess);
            } else {
                // Exact settlement - debt is fully cleared
                netBalances.delete(key);
            }
        } else if (netBalances.has(reverseKey)) {
            // To owes From (reverse direction): From paying To increases what To owes
            // This means From paid when they should have received, so To owes even more
            const current = netBalances.get(reverseKey)!;
            netBalances.set(reverseKey, current + settlementAmount);
        } else {
            // No existing balance in either direction
            // From paid To when there was no debt, so now To owes From
            netBalances.set(reverseKey, settlementAmount);
        }
    }

    // Simplify balances
    return simplifyBalances(netBalances, userNames);
}

function simplifyBalances(netBalances: Map<string, number>, userNames: Map<string, string>): Balance[] {
    // Calculate net balance per user
    const userNetBalance = new Map<string, number>();

    for (const [key, amount] of netBalances) {
        if (amount < 0.01) continue;
        const [fromId, toId] = key.split('->');

        userNetBalance.set(fromId, (userNetBalance.get(fromId) || 0) - amount);
        userNetBalance.set(toId, (userNetBalance.get(toId) || 0) + amount);
    }

    // Separate creditors and debtors
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [userId, balance] of userNetBalance) {
        if (balance > 0.01) {
            creditors.push({ id: userId, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ id: userId, amount: -balance });
        }
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Greedy matching
    const simplified: Balance[] = [];

    while (creditors.length > 0 && debtors.length > 0) {
        const creditor = creditors[0];
        const debtor = debtors[0];
        const amount = Math.min(creditor.amount, debtor.amount);

        if (amount > 0.01) {
            simplified.push({
                fromUserId: debtor.id,
                fromUserName: userNames.get(debtor.id) || 'Unknown',
                toUserId: creditor.id,
                toUserName: userNames.get(creditor.id) || 'Unknown',
                amount: Math.round(amount * 100) / 100
            });
        }

        creditor.amount -= amount;
        debtor.amount -= amount;

        if (creditor.amount < 0.01) creditors.shift();
        if (debtor.amount < 0.01) debtors.shift();
    }

    return simplified;
}
