import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Expense from '@/models/Expense';
import ExpenseSplit from '@/models/ExpenseSplit';
import User from '@/models/User';
import { calculateSplit, SplitType } from '@/lib/splitCalculator';
import { generateId } from '@/lib/utils';

// GET /api/groups/[id]/expenses - Get all expenses in a group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;

        await connectDB();

        const expenses = await Expense.find({ group_id: groupId }).sort({ created_at: -1 }).populate({
            path: 'paid_by_id',
            model: User,
            select: 'id name email'
        });

        // Get splits for each expense
        const expensesWithSplits = await Promise.all(
            expenses.map(async (expense) => {
                const splits = await ExpenseSplit.find({ expense_id: expense._id }).populate({
                    path: 'user_id',
                    model: User,
                    select: 'id name email'
                });

                // @ts-ignore
                const payer = expense.paid_by_id;

                return {
                    id: expense._id,
                    description: expense.description,
                    amount: Number(expense.amount),
                    splitType: expense.split_type,
                    // @ts-ignore - payer is populated from User model
                    paidBy: { id: payer._id, name: payer.name, email: payer.email },
                    splits: splits.map(s => {
                        const user = s.user_id as any;
                        return {
                            user: { id: user._id, name: user.name, email: user.email },
                            amount: Number(s.amount),
                            percentage: s.percentage
                        };
                    }),
                    createdAt: expense.created_at
                };
            })
        );

        return NextResponse.json(expensesWithSplits);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

// POST /api/groups/[id]/expenses - Add an expense to a group
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params;
        const body = await request.json();
        const { description, amount, paidById, splitType, splits } = body;

        // Validation
        if (!description || !amount || !paidById || !splitType || !splits) {
            return NextResponse.json(
                { error: 'Missing required fields: description, amount, paidById, splitType, splits' },
                { status: 400 }
            );
        }

        if (!['EQUAL', 'EXACT', 'PERCENTAGE'].includes(splitType)) {
            return NextResponse.json(
                { error: 'Invalid splitType. Must be EQUAL, EXACT, or PERCENTAGE' },
                { status: 400 }
            );
        }

        // Calculate splits
        let calculatedSplits;
        try {
            calculatedSplits = calculateSplit(amount, splitType as SplitType, splits);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid split';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        await connectDB();

        // Create expense
        const expenseId = generateId();
        await Expense.create({
            _id: expenseId,
            description,
            amount: Number(amount),
            split_type: splitType,
            paid_by_id: paidById,
            group_id: groupId
        });

        // Create splits
        for (const split of calculatedSplits) {
            const splitId = generateId();
            await ExpenseSplit.create({
                _id: splitId,
                expense_id: expenseId,
                user_id: split.userId,
                amount: split.amount,
                percentage: split.percentage
            });
        }

        // Fetch the created expense with details
        const payer = await User.findById(paidById);

        return NextResponse.json({
            id: expenseId,
            description,
            amount,
            splitType,
            // @ts-ignore
            paidBy: { id: payer._id, name: payer.name, email: payer.email },
            splits: calculatedSplits.map(s => ({ userId: s.userId, amount: s.amount }))
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
