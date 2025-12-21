
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <Toaster position="top-center" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center border border-border relative">
                        <Wallet className="w-6 h-6 text-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2 tracking-tight">Create Account</h2>
                <p className="text-center text-muted-foreground mb-8 text-sm">Join the simple way to share expenses</p>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-12 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="••••••••"
                                required
                                minLength={6}
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

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 pr-12 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all text-sm ${confirmPassword && password !== confirmPassword
                                    ? 'border-red-500/50 focus:ring-red-500/50'
                                    : 'border-border focus:ring-primary/20 focus:border-primary'
                                    }`}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-red-400 text-xs mt-1 ml-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                        className="w-full py-2.5 bg-foreground text-background rounded-lg font-bold hover:bg-zinc-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

