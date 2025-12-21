import mongoose, { Schema, Model } from 'mongoose';

export interface IGroupRequest {
    _id: string;
    group_id: string;
    user_id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: Date;
}

const GroupRequestSchema = new Schema<IGroupRequest>({
    _id: { type: String, required: true },
    group_id: { type: String, required: true, ref: 'Group' },
    user_id: { type: String, required: true, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

const GroupRequest: Model<IGroupRequest> = mongoose.models.GroupRequest || mongoose.model<IGroupRequest>('GroupRequest', GroupRequestSchema);
export default GroupRequest;
