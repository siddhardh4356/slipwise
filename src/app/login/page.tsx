
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
        <div className="min-h-screen bg-[#452829] text-[#F3E8DF] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Toaster position="top-center" />

            {/* Background Blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#E8D1C5] blur-[150px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#57595B] blur-[150px] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-[#57595B]/10 backdrop-blur-xl border border-[#E8D1C5]/10 rounded-3xl p-8 shadow-2xl relative z-10"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#E8D1C5]/10 rounded-2xl flex items-center justify-center border border-[#E8D1C5]/20">
                        <Wallet className="w-8 h-8 text-[#E8D1C5]" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 text-[#F3E8DF]">Welcome Back</h2>
                <p className="text-center text-[#E8D1C5]/60 mb-8">Sign in to continue to SlipWise</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#E8D1C5]/80 mb-1 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#452829]/50 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-[#E8D1C5]/80 ml-1">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-[#E8D1C5]/60 hover:text-[#E8D1C5] transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-[#452829]/50 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8D1C5]/60 hover:text-[#E8D1C5] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-[#E8D1C5]/60">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-[#E8D1C5] font-semibold hover:underline">
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForgotPassword(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#452829] border border-[#E8D1C5]/20 rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#F3E8DF]">Reset Password</h3>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-[#E8D1C5]/60 hover:text-[#E8D1C5] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-[#E8D1C5]/10 rounded-xl flex items-center justify-center border border-[#E8D1C5]/20">
                                    <Mail className="w-6 h-6 text-[#E8D1C5]" />
                                </div>
                            </div>

                            <p className="text-center text-[#E8D1C5]/60 mb-6">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#57595B]/20 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                                    placeholder="Enter your email"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-3 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {forgotLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-[#E8D1C5]/40 text-sm mt-4">
                                Remember your password?{' '}
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-[#E8D1C5] hover:underline"
                                >
                                    Back to login
                                </button>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

