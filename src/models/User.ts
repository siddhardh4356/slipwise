import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    _id: string;
    name: string;
    email: string;
    password_hash?: string;
    reset_token?: string;
    reset_token_expiry?: Date;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String },
    reset_token: { type: String },
    reset_token_expiry: { type: Date },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: false
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
