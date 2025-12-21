import mongoose, { Schema, Model } from 'mongoose';

export interface IExpenseSplit {
    _id: string;
    expense_id: string;
    user_id: string;
    amount: number;
    percentage?: number;
}

const ExpenseSplitSchema = new Schema<IExpenseSplit>({
    _id: { type: String, required: true },
    expense_id: { type: String, required: true, ref: 'Expense' },
    user_id: { type: String, required: true, ref: 'User' },
    amount: { type: Number, required: true },
    percentage: { type: Number },
}, {
    timestamps: false
});

// Unique constraint per expense+user
ExpenseSplitSchema.index({ expense_id: 1, user_id: 1 }, { unique: true });

const ExpenseSplit: Model<IExpenseSplit> = mongoose.models.ExpenseSplit || mongoose.model<IExpenseSplit>('ExpenseSplit', ExpenseSplitSchema);
export default ExpenseSplit;
