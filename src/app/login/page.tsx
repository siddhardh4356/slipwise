
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, X, Mail, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                toast.success('Welcome back!');
                router.push('/dashboard');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Login failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setTimeout(() => setShowForgotPassword(false), 2000);
            } else {
                toast.error(data.error || 'Something went wrong');
            }
        } catch (err) {
            toast.error('Failed to send reset link');
        } finally {
            setForgotLoading(false);
            setForgotEmail('');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <Toaster position="top-center" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-center text-muted-foreground mb-8 text-sm">Sign in to continue to SlipWise</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold uppercase text-muted-foreground ml-1">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-xs text-primary hover:text-emerald-400 transition-colors font-medium"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-foreground text-background rounded-lg font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-primary font-medium hover:underline">
                        Sign Up
                    </Link>
                </div>
            </motion.div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotPassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForgotPassword(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Reset Password</h3>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    placeholder="Enter your email"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-2.5 bg-foreground text-background rounded-lg font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {forgotLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

