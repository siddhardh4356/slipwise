import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.reset_token = resetToken;
        user.reset_token_expiry = new Date(resetTokenExpiry);
        await user.save();

        // Send email
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await sendEmail(
            email,
            'Reset your SlipWise Password',
            `
            <div style="font-family: Arial, sans-serif; color: #18181b; padding: 20px;">
                <h2 style="color: #10b981;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>We received a request to reset your password for your SlipWise account.</p>
                <p>Click the button below to set a new password:</p>
                <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0;">Reset Password</a>
                <p style="color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                <p>Thanks,<br/>The SlipWise Team</p>
            </div>
            `
        );

        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
