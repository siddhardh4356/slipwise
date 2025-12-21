import mongoose, { Schema, Model } from 'mongoose';

export interface IGroupMember {
    _id: string;
    user_id: string;
    group_id: string;
    joined_at: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>({
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: 'User' },
    group_id: { type: String, required: true, ref: 'Group' },
    joined_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

// Compound index to ensure uniqueness of user+group
GroupMemberSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

const GroupMember: Model<IGroupMember> = mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
export default GroupMember;
