"use client";

import Link from 'next/link';
import { ArrowRight, PieChart, Search, Users, Shield, Zap, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">SlipWise</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Log In</Link>
                    <Link href="/signup" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center max-w-4xl mx-auto"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-8 text-sm font-medium text-muted-foreground">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        V2.0 is now live
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Split bills, <br /> not friendships.
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                        The elegant way to track shared expenses. Now with powerful analytics, smart search, and a beautiful modern interface designed for you.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:translate-y-[-2px] flex items-center justify-center gap-2">
                            Start Splitting Free <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border border-border hover:bg-secondary/50 transition-all">
                            View Demo
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
                >
                    <FeatureCard
                        icon={<PieChart className="w-6 h-6 text-emerald-500" />}
                        title="Smart Analytics"
                        description="Visualize your spending habits with interactive charts. Track expenses by category, monthly trends, and group breakdown."
                    />
                    <FeatureCard
                        icon={<Search className="w-6 h-6 text-blue-500" />}
                        title="Global Search"
                        description="Find anything instantly. Press Cmd+K to jump between groups, search through expenses, or find friends in seconds."
                    />
                    <FeatureCard
                        icon={<LayoutTemplate className="w-6 h-6 text-amber-500" />}
                        title="Modern Interface"
                        description="Experience a beautifully crafted UI with Dark Mode support, glassmorphism aesthetics, and fluid animations."
                    />
                </motion.div>

                {/* Floating UI Elements (Decorative) */}
                <div className="absolute top-1/2 left-10 -translate-y-1/2 hidden xl:block opacity-20 pointer-events-none">
                    <div className="bg-card border border-border p-4 rounded-xl shadow-2xl w-64 rotate-[-6deg]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">🍕</div>
                            <div>
                                <h3 className="font-bold text-sm">Dinner at Mario's</h3>
                                <p className="text-xs text-muted-foreground">You paid ₹2,400</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-purple-500" />
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/2 right-10 -translate-y-1/2 hidden xl:block opacity-20 pointer-events-none">
                    <div className="bg-card border border-border p-4 rounded-xl shadow-2xl w-64 rotate-[6deg]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold uppercase text-muted-foreground">Total Owed</span>
                            <Shield className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-500">₹12,450</div>
                        <div className="text-xs text-emerald-500/60 mt-1">+ ₹1,200 this month</div>
                    </div>
                </div>

            </main>

            <footer className="border-t border-border mt-20">
                <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center text-sm text-muted-foreground">
                    <p>© 2024 SlipWise Inc.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-foreground">Privacy</a>
                        <a href="#" className="hover:text-foreground">Terms</a>
                        <a href="#" className="hover:text-foreground">Github</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border p-8 rounded-2xl hover:border-primary/50 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
