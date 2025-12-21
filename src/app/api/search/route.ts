import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import Group from '@/models/Group';
import Expense from '@/models/Expense';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        await connectDB();

        const regex = new RegExp(query, 'i'); // Case-insensitive fuzzy search

        const [groups, users, expenses] = await Promise.all([
            Group.find({
                $or: [{ name: regex }, { join_code: regex }]
            }).limit(5).select('name join_code _id'),

            User.find({
                $or: [{ name: regex }, { email: regex }]
            }).limit(5).select('name email avatar _id'),

            Expense.find({
                description: regex
            })
                .populate('paidBy', 'name')
                .limit(5)
                .sort({ createdAt: -1 })
                .select('description amount category _id paidBy')
        ]);

        const results = [
            ...groups.map((g: any) => ({ type: 'group', id: g._id, title: g.name, subtitle: `Code: ${g.join_code}` })),
            ...users.map((u: any) => ({ type: 'user', id: u._id, title: u.name, subtitle: u.email, avatar: u.avatar })),
            ...expenses.map((e: any) => ({ type: 'expense', id: e._id, title: e.description, subtitle: `₹${e.amount} • Paid by ${e.paidBy?.name || 'Unknown'}` }))
        ];

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
