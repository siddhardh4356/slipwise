import mongoose, { Schema, Model } from 'mongoose';

export interface ISettlement {
    _id: string;
    from_user_id: string;
    to_user_id: string;
    amount: number;
    group_id: string;
    created_at: Date;
}

const SettlementSchema = new Schema<ISettlement>({
    _id: { type: String, required: true },
    from_user_id: { type: String, required: true, ref: 'User' },
    to_user_id: { type: String, required: true, ref: 'User' },
    amount: { type: Number, required: true },
    group_id: { type: String, required: true, ref: 'Group' },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

const Settlement: Model<ISettlement> = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', SettlementSchema);
export default Settlement;
