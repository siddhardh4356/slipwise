import mongoose, { Schema, Model } from 'mongoose';

export interface IGroup {
    _id: string;
    name: string;
    join_code?: string;
    created_by_id?: string;
    created_at: Date;
}

const GroupSchema = new Schema<IGroup>({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    join_code: { type: String, unique: true, sparse: true },
    created_by_id: { type: String, ref: 'User' },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
