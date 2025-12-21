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
        <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4 border border-border">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">New Password</h2>
                        <p className="text-muted-foreground mt-2 text-sm">Create a secure password for your account</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">All Set!</h3>
                            <p className="text-muted-foreground mb-6 text-sm">Your password has been updated. You can now log in.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                Back to Login <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            placeholder="Min. 6 characters"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            placeholder="Re-enter password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-foreground text-background rounded-lg font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
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
        <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
            <ResetPasswordContent />
        </React.Suspense>
    );
}
