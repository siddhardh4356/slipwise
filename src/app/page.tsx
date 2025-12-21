
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PieChart, Users, Wallet } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#452829] text-[#F3E8DF] selection:bg-[#E8D1C5] selection:text-[#452829] relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#E8D1C5] blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#57595B] blur-[100px]" />
            </div>

            {/* Nav */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-sm z-50">
                <h1 className="text-2xl font-bold text-[#E8D1C5] flex items-center gap-2">
                    <Wallet className="w-8 h-8" /> SlipWise
                </h1>
                <div className="flex gap-4">
                    <Link href="/login" className="px-6 py-2 rounded-full text-[#E8D1C5] hover:bg-[#57595B]/30 border border-transparent hover:border-[#E8D1C5]/20 transition-all">Login</Link>
                    <Link href="/signup" className="px-6 py-2 bg-[#E8D1C5] text-[#452829] rounded-full font-bold hover:bg-[#F3E8DF] shadow-lg shadow-[#E8D1C5]/20 transition-all hover:scale-105 active:scale-95">Sign Up</Link>
                </div>
            </nav>

            {/* Hero */}
            <main className="flex flex-col items-center justify-center text-center px-4 mt-20 md:mt-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block px-4 py-1 rounded-full bg-[#57595B]/30 border border-[#E8D1C5]/20 text-[#E8D1C5]/80 text-sm mb-6 backdrop-blur-md">
                        Expenses Simplified
                    </span>
                    <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-[#F3E8DF] to-[#E8D1C5] bg-clip-text text-transparent drop-shadow-sm">
                        Split Expenses,<br />Not Friendships.
                    </h2>
                    <p className="text-xl text-[#E8D1C5]/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The modern way to track shared expenses. Smart balances, realtime insights, and seamless settlements for groups of any size.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E8D1C5] text-[#452829] rounded-full text-lg font-bold hover:bg-[#F3E8DF] shadow-xl shadow-[#E8D1C5]/20 transition-all transform hover:-translate-y-1">
                            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#57595B]/30 text-[#E8D1C5] rounded-full text-lg font-medium hover:bg-[#57595B]/50 border border-[#E8D1C5]/10 backdrop-blur-md transition-all">
                            Sign In
                        </Link>
                    </div>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto w-full px-4">
                    {[
                        { icon: Users, title: "Groups", desc: "Create groups for trips, roommates, or events." },
                        { icon: Wallet, title: "Smart Splitting", desc: "Split equally, exactly, or by percentage." },
                        { icon: PieChart, title: "Insights", desc: "Visualize spending with interactive charts." }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="group p-8 rounded-3xl bg-[#57595B]/10 backdrop-blur-md border border-[#E8D1C5]/10 hover:border-[#E8D1C5]/30 transition-all hover:bg-[#57595B]/20 hover:-translate-y-2"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#452829] flex items-center justify-center mb-6 border border-[#E8D1C5]/10 group-hover:border-[#E8D1C5]/30 transition-colors mx-auto md:mx-0">
                                <feature.icon className="w-8 h-8 text-[#E8D1C5]" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#F3E8DF] text-center md:text-left">{feature.title}</h3>
                            <p className="text-[#E8D1C5]/60 leading-relaxed text-center md:text-left">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </main>

            <footer className="mt-32 py-8 text-center text-[#E8D1C5]/30 text-sm border-t border-[#E8D1C5]/5">
                &copy; 2025 SlipWise.
            </footer>
        </div>
    )
}
