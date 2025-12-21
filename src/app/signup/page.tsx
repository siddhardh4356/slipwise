
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, Loader2, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                toast.success('Account created! Redirecting...');
                // Auto login handling or just redirect
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Signup failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#452829] text-[#F3E8DF] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Toaster position="top-center" />

            {/* Background Blobs */}
            <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#E8D1C5] blur-[150px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#57595B] blur-[150px] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-[#57595B]/10 backdrop-blur-xl border border-[#E8D1C5]/10 rounded-3xl p-8 shadow-2xl relative z-10"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#E8D1C5]/10 rounded-2xl flex items-center justify-center border border-[#E8D1C5]/20 relative">
                        <Wallet className="w-8 h-8 text-[#E8D1C5]" />
                        <div className="absolute -top-2 -right-2 bg-[#E8D1C5] text-[#452829] p-1 rounded-full">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 text-[#F3E8DF]">Create Account</h2>
                <p className="text-center text-[#E8D1C5]/60 mb-8">Join the innovative way to share expenses</p>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#E8D1C5]/80 mb-1 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#452829]/50 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>

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
                        <label className="block text-sm font-medium text-[#E8D1C5]/80 mb-1 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#452829]/50 border border-[#E8D1C5]/20 rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 focus:ring-[#E8D1C5]/50 transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#E8D1C5]/80 mb-1 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-3 bg-[#452829]/50 border rounded-xl text-[#F3E8DF] placeholder-[#E8D1C5]/30 focus:outline-none focus:ring-2 transition-all ${confirmPassword && password !== confirmPassword
                                    ? 'border-red-500/50 focus:ring-red-500/50'
                                    : 'border-[#E8D1C5]/20 focus:ring-[#E8D1C5]/50'
                                }`}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-red-400 text-sm mt-1 ml-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                        className="w-full py-4 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started'}
                    </button>
                </form>

                <div className="mt-6 text-center text-[#E8D1C5]/60">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#E8D1C5] font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

