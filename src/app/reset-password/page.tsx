'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            setTimeout(() => router.push('/login'), 2000);
        }
    }, [token, router]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                toast.success('Password reset successfully!');
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setStatus('error');
                toast.error(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setStatus('error');
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-[#452829] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#452829] border border-[#E8D1C5]/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8D1C5]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E8D1C5]/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#E8D1C5]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E8D1C5]/20">
                            <Lock className="w-8 h-8 text-[#E8D1C5]" />
                        </div>
                        <h2 className="text-3xl font-bold text-[#F3E8DF]">New Password</h2>
                        <p className="text-[#E8D1C5]/60 mt-2">Create a secure password for your account</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-[#F3E8DF] mb-2">All Set!</h3>
                            <p className="text-[#E8D1C5]/60 mb-6">Your password has been updated. You can now log in.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all flex items-center justify-center gap-2"
                            >
                                Back to Login <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#E8D1C5] mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E8D1C5]/50" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3 bg-[#57595B]/20 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                                            placeholder="Min. 6 characters"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E8D1C5]/50 hover:text-[#E8D1C5]"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#E8D1C5] mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E8D1C5]/50" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3 bg-[#57595B]/20 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                                            placeholder="Re-enter password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#E8D1C5]/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default function ResetPasswordPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#452829] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#E8D1C5] animate-spin" /></div>}>
            <ResetPasswordContent />
        </React.Suspense>
    );
}
