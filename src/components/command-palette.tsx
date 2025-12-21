"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, CreditCard, User, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    type: 'group' | 'user' | 'expense';
    id: string;
    title: string;
    subtitle: string;
    avatar?: string;
}

export function CommandPalette({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (result: SearchResult) => void }) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter' && results.length > 0) {
                handleSelect(results[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data.results);
                        setSelectedIndex(0);
                    }
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        onSelect(result);
        onClose();
    };

    // Custom onSelect prop logic
    // Since this is inside Dashboard, we probably want to *set the selected group*.
    // But this component might be reusable.
    // For this iteration, let's allow passing an `onSelect` callback instead of handling it internally if we want tight integration.
    // However, `CommandPalette` as a standalone component is better.
    // Let's stick to closing for now, as I don't have easy access to `setSelectedGroup` here without prop drilling.
    // Wait, I can't easily "navigate" to a group if it's just state in Dashboard.
    // Modification: I'll accept `onSelect` prop.

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh] ring-1 ring-white/10"
                    >
                        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                                placeholder="Search groups, friends, expenses..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2">
                            {loading && (
                                <div className="py-8 flex justify-center text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            )}

                            {!loading && results.length === 0 && query.length >= 2 && (
                                <div className="py-8 text-center text-muted-foreground">
                                    No results found.
                                </div>
                            )}

                            {!loading && results.length === 0 && query.length < 2 && (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    Type at least 2 characters to search...
                                </div>
                            )}

                            <div className="space-y-1">
                                {results.map((result, index) => {
                                    const isSelected = index === selectedIndex;
                                    const Icon = result.type === 'group' ? Users : result.type === 'user' ? User : CreditCard;

                                    return (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleSelect(result)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${isSelected ? 'bg-primary/20' : 'hover:bg-secondary/50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                                {result.avatar ? <span className="text-sm">{result.avatar}</span> : <Icon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{result.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                            </div>
                                            {isSelected && <ArrowRight className="w-4 h-4 text-primary opacity-50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-4 py-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex justify-between">
                            <span>Pro tip: Use arrows to navigate</span>
                            <span>ESC to close</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
