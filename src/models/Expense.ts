import mongoose, { Schema, Model } from 'mongoose';

export interface IExpense {
    _id: string;
    description: string;
    amount: number;
    split_type: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
    paid_by_id: string;
    group_id: string;
    created_at: Date;
}

const ExpenseSchema = new Schema<IExpense>({
    _id: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    split_type: { type: String, enum: ['EQUAL', 'EXACT', 'PERCENTAGE'], required: true },
    paid_by_id: { type: String, required: true, ref: 'User' },
    group_id: { type: String, required: true, ref: 'Group' },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
