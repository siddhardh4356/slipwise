'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Wallet, Users, Plus, ArrowUpRight, ArrowDownLeft, LogOut,
  CreditCard, Grid, Activity, Settings, Moon, Sun, Copy, Check, X,
  Zap, TrendingUp, Clock, DollarSign, Tag, FileText, Download,
  Utensils, Car, Home, ShoppingBag, Film, Plane, Heart, Gift, Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { CommandPalette } from '@/components/command-palette';

// --- Types ---
interface UserBalanceSummary {
  userId: string;
  userName: string;
  totalOwes: number;
  totalOwed: number;
  netBalance: number;
}

type User = { id: string; name: string; email: string; avatar?: string };
type Group = { id: string; name: string; joinCode: string; created_by_id: string; members: { user: User }[]; _count?: { expenses: number } };
type Expense = { id: string; description: string; amount: number; paidBy: User; splitType: string; splits: any[]; createdAt: string; category?: string };
type Balance = { fromUserId: string; fromUserName: string; toUserId: string; toUserName: string; amount: number };
type Request = { id: string; user_id: string; name: string; email: string; created_at: string };
type ActivityItem = { id: string; type: 'expense' | 'settlement' | 'member_joined'; description: string; amount?: number; userName: string; groupName: string; createdAt: string };

// Expense Categories
const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Drinks', icon: Utensils, color: '#10b981' }, // Emerald-500
  { id: 'transport', label: 'Transport', icon: Car, color: '#3b82f6' }, // Blue-500
  { id: 'housing', label: 'Housing', icon: Home, color: '#f59e0b' }, // Amber-500
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#ec4899' }, // Pink-500
  { id: 'entertainment', label: 'Entertainment', icon: Film, color: '#8b5cf6' }, // Violet-500
  { id: 'travel', label: 'Travel', icon: Plane, color: '#06b6d4' }, // Cyan-500
  { id: 'health', label: 'Health', icon: Heart, color: '#ef4444' }, // Red-500
  { id: 'gifts', label: 'Gifts', icon: Gift, color: '#a855f7' }, // Purple-500
  { id: 'other', label: 'Other', icon: Tag, color: '#71717a' }, // Zinc-500
];

// --- Components ---

const GlassCard = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`bg-card border border-border rounded-xl p-6 shadow-sm ${className}`}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'groups' | 'activity' | 'settings'>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [groupBalances, setGroupBalances] = useState<Balance[]>([]);
  const [groupRequests, setGroupRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState<'EQUAL' | 'EXACT' | 'PERCENTAGE'>('EQUAL');
  const [expenseSplits, setExpenseSplits] = useState<{ userId: string; amount?: number; percentage?: number }[]>([]);
  const [expenseCategory, setExpenseCategory] = useState('other');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Activity Feed & Stats
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [settlingBalance, setSettlingBalance] = useState<Balance | null>(null);
  const [userBalances, setUserBalances] = useState<UserBalanceSummary | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<{ name: string; value: number }[]>([]);
  const [groupStats, setGroupStats] = useState<{ name: string; value: number }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; value: number }[]>([]);

  // --- Actions & Helpers (Hoisted) ---
  // ... (fetchGroups, etc. remain the same) 

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGroups(data);
        } else {
          setGroups([]);
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalances = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/balances`);
      if (res.ok) {
        const data = await res.json();
        setUserBalances(data);
      }
    } catch (error) {
      console.error('Failed to fetch user balances:', error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyStats(data.monthly);
        setGroupStats(data.byGroup);
        setCategoryStats(data.byCategory || []);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchGroups();
        fetchUserBalances(data.user.id);
        fetchUserStats(data.user.id);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      router.push('/login');
    }
  };

  const handleUpdateAvatar = (avatar: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar });
      setShowAvatarModal(false);
      toast.success('Avatar updated!');
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    setLoading(true);
    try {
      const [expensesRes, balancesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/expenses`),
        fetch(`/api/groups/${groupId}/balances`)
      ]);
      setGroupExpenses(await expensesRes.json());
      const balanceData = await balancesRes.json();
      setGroupBalances(balanceData.balances || []);

      const group = groups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(group);
        if (group.created_by_id === currentUser?.id) {
          const reqRes = await fetch(`/api/groups/${groupId}/requests`);
          if (reqRes.ok) setGroupRequests(await reqRes.json());
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newGroupName,
        memberIds: [currentUser.id]
      }),
    });

    if (res.ok) {
      toast.success('Group created!');
      setNewGroupName('');
      setShowCreateGroup(false);
      fetchGroups();
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode, userId: currentUser.id }),
    });

    if (res.ok) {
      toast.success('Request sent to admin!');
      setJoinCode('');
      setShowJoinGroup(false);
    } else {
      toast.error('Invalid code');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const res = await fetch(`/api/requests/${requestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      toast.success(`Request ${action}D`);
      setGroupRequests(prev => prev.filter(r => r.id !== requestId));
      if (action === 'APPROVE' && selectedGroup) fetchGroupDetails(selectedGroup.id);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !currentUser) return;

    let payerId = expensePayer;
    if (!payerId && currentUser) payerId = currentUser.id;

    if (!expenseDesc || !expenseAmount || !payerId) {
      toast.error('Please fill in all fields');
      return;
    }

    let splitsToSubmit = expenseSplits;
    if (expenseSplits.length === 0 && expenseSplitType === 'EQUAL') {
      splitsToSubmit = selectedGroup.members.map(m => ({ userId: m.user.id }));
    }

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          paidById: payerId,
          splitType: expenseSplitType,
          splits: splitsToSubmit,
          category: expenseCategory
        })
      });

      if (res.ok) {
        toast.success('Expense added!');
        setShowAddExpense(false);
        setExpenseDesc('');
        setExpenseAmount('');
        setExpensePayer(currentUser?.id || '');
        setExpenseSplits([]);
        setExpenseSplitType('EQUAL');
        setExpenseCategory('other');

        fetchGroupDetails(selectedGroup.id);
        if (currentUser) fetchUserBalances(currentUser.id);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add expense');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleSettleUp = async (balance: Balance) => {
    if (!selectedGroup || !currentUser) return;

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: balance.fromUserId,
          toUserId: balance.toUserId,
          amount: balance.amount,
          groupId: selectedGroup.id
        })
      });

      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#71717a', '#3b82f6', '#f43f5e']
        });

        toast.success('🎉 Debt settled! Great job!');
        setSettlingBalance(null);
        fetchGroupDetails(selectedGroup.id);
        if (currentUser) fetchUserBalances(currentUser.id);
      } else {
        toast.error('Failed to settle');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Join code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!selectedGroup || groupExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split Type'];
    const rows = groupExpenses.map(e => [
      new Date(e.createdAt).toLocaleDateString(),
      e.description,
      EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || 'Other',
      e.amount.toString(),
      e.paidBy.name,
      e.splitType
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedGroup.name}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Expenses exported to CSV!');
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!selectedGroup || groupExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(24, 24, 27); // Zinc-900
    doc.text(`${selectedGroup.name} - Expense Report`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Expenses: ₹${totalExpenses}`, 14, 40);
    doc.text(`Number of Transactions: ${groupExpenses.length}`, 14, 48);
    doc.text(`Members: ${selectedGroup.members.length}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Description', 'Category', 'Amount', 'Paid By']],
      body: groupExpenses.map(e => [
        new Date(e.createdAt).toLocaleDateString(),
        e.description,
        EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || 'Other',
        `₹${e.amount}`,
        e.paidBy.name
      ]),
      headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
      alternateRowStyles: { fillColor: [244, 244, 245] }, // Zinc-100
    });

    if (groupBalances.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Outstanding Balances:', 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['From', 'To', 'Amount']],
        body: groupBalances.map(b => [b.fromUserName, b.toUserName, `₹${b.amount}`]),
        headStyles: { fillColor: [39, 39, 42] }, // Zinc-800
      });
    }

    doc.save(`${selectedGroup.name}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report exported to PDF!');
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  // Global Search Shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search Handler
  const handleSearchSelect = (result: any) => { // Type as any for now to avoid circular deps or re-declaring types
    if (result.type === 'group') {
      const groupToSelect = groups.find(g => g.id === result.id);
      if (groupToSelect) {
        setSelectedGroup(groupToSelect);
        fetchGroupDetails(result.id); // Ensure we have latest details/expenses for this group
        setActiveTab('groups');
      } else {
        // If loading all groups failed or not in initial list, we might need to fetch it individually
        // For now, let's assume it's in the list or we can force fetch it.
        // Simplified: Switch to groups tab, and maybe try to set it if we can.
        // Actually, if it's not in 'groups', we can't easily 'select' it without adding it to state.
        // Let's rely on fetchGroups having run. 
        setActiveTab('groups');
        // Ideally we should fetch specific group here if missing.
        toast.success(`Navigating to ${result.title}`);
      }
    } else if (result.type === 'expense') {
      toast('Expense navigation coming soon!', { icon: '🚧' });
    } else if (result.type === 'user') {
      toast('User profiles coming soon!', { icon: '🚧' });
    }
  };

  if (!mounted) return null;

  // --- Charts Data & Render ---
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (!currentUser) return null;

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex font-sans">
      <Toaster position="bottom-right" />
      <CommandPalette
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSearchSelect}
      />

      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col hidden md:flex">
        <h1 className="text-2xl font-bold text-foreground mb-12 flex items-center gap-2 tracking-tight">
          <Wallet className="w-8 h-8 text-primary" /> SlipWise
        </h1>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedGroup(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
          >
            <Grid className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'groups' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" /> Groups
          </button>
          <button
            onClick={() => { setActiveTab('activity'); setSelectedGroup(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'activity' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
          >
            <Activity className="w-4 h-4" /> Activity
          </button>
        </nav>

        <div className="pt-6 border-t border-border space-y-4">
          <button
            onClick={() => { setActiveTab('settings'); setSelectedGroup(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'settings' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary md:hidden"><Wallet className="inline-block w-6 h-6 mr-2" />SlipWise</h1>

          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all mr-2"
              title="Search (Cmd+K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-card px-4 py-2 rounded-full border border-border">
              <div className="text-right hidden lg:block">
                <p className="font-semibold text-sm text-foreground">{currentUser.name}</p>
              </div>
              <button onClick={() => setShowAvatarModal(true)} className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform overflow-hidden relative">
                {currentUser.avatar ? <span className="text-xl">{currentUser.avatar}</span> : currentUser.name[0]}
              </button>
            </div>
            <button onClick={handleLogout} className="md:hidden text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-6 text-foreground tracking-tight">Overview</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><ArrowUpRight className="w-4 h-4" /> You Owe</h3>
                  <p className="text-3xl font-bold text-foreground">
                    {userBalances ? `₹${userBalances.totalOwes}` : '...'}
                  </p>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><ArrowDownLeft className="w-4 h-4" /> Owed to You</h3>
                  <p className="text-3xl font-bold text-emerald-500">
                    {userBalances ? `₹${userBalances.totalOwed}` : '...'}
                  </p>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">Total Balance</h3>
                  <p className={`text-3xl font-bold ${(userBalances?.netBalance || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {userBalances ? (userBalances.netBalance >= 0 ? '+' : '') + `₹${userBalances.netBalance}` : '...'}
                  </p>
                </GlassCard>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[400px]">
                  <h3 className="text-lg font-bold mb-6 text-foreground">Monthly Spending</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={monthlyStats}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-[400px]">
                  <h3 className="text-lg font-bold mb-6 text-foreground">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => {
                          const cat = EXPENSE_CATEGORIES.find(c => c.id === entry.name);
                          return (
                            <Cell key={`cell-${index}`} fill={cat ? cat.color : COLORS[index % COLORS.length]} stroke="none" />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any, name: any, props: any) => {
                          const categoryId = props.payload.name;
                          const cat = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
                          return [`₹${value}`, cat ? cat.label : categoryId];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'groups' && !selectedGroup && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Groups</h2>
                <div className="flex gap-3">
                  <button onClick={() => setShowJoinGroup(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all text-sm font-medium border border-border">
                    Join via Code
                  </button>
                  <button onClick={() => setShowCreateGroup(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center gap-2 text-sm shadow-sm">
                    <Plus className="w-4 h-4" /> Create Group
                  </button>
                </div>
              </div>

              {/* Create Group Modal */}
              <AnimatePresence>
                {showCreateGroup && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <div className="bg-card p-6 rounded-2xl border border-border w-full max-w-sm shadow-xl">
                      <h3 className="text-xl font-bold mb-6 text-foreground">Create New Group</h3>
                      <input
                        className="w-full bg-secondary/50 p-3 rounded-lg border border-border mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        placeholder="Group Name (e.g. Summer Trip)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 hover:bg-secondary rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={handleCreateGroup} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm">Create</button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {showJoinGroup && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <div className="bg-card p-6 rounded-2xl border border-border w-full max-w-sm shadow-xl">
                      <h3 className="text-xl font-bold mb-6 text-foreground">Join Group</h3>
                      <input
                        className="w-full bg-secondary/50 p-3 rounded-lg border border-border mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-widest text-center text-lg uppercase"
                        placeholder="ENTER CODE"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowJoinGroup(false)} className="px-4 py-2 hover:bg-secondary rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={handleJoinGroup} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm">Join</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                  <GlassCard key={group.id} className="cursor-pointer group relative overflow-hidden hover:border-primary/50 transition-colors" onClick={() => fetchGroupDetails(group.id)}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Users className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => handleCopyCode(group.joinCode, e)}
                        className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {copiedCode === group.joinCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {group.joinCode}
                      </button>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{group.name}</h3>
                    <div className="flex -space-x-2 mb-4">
                      {group.members.slice(0, 4).map((m, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm" title={m.user.name}>
                          {m.user.name[0]}
                        </div>
                      ))}
                      {group.members.length > 4 && <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm">+{group.members.length - 4}</div>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {selectedGroup && (
            <motion.div
              key="groupDetail"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <button onClick={() => setSelectedGroup(null)} className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-6 transition-colors text-sm font-medium">
                &larr; Back to Groups
              </button>

              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-foreground tracking-tight">{selectedGroup.name}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(selectedGroup.joinCode)}
                      className="px-2 py-1 rounded bg-secondary/50 font-mono text-xs tracking-widest text-muted-foreground border border-border hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2"
                    >
                      {selectedGroup.joinCode}
                      {copiedCode === selectedGroup.joinCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Share this code to invite others</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex gap-2 hidden sm:flex">
                    <button
                      onClick={exportToCSV}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold hover:bg-secondary/80 transition-all flex items-center gap-2 border border-border text-sm"
                      title="Export to CSV"
                    >
                      <FileText className="w-4 h-4" /> CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold hover:bg-secondary/80 transition-all flex items-center gap-2 border border-border text-sm"
                      title="Export to PDF"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setExpensePayer(currentUser.id);
                      setShowAddExpense(true);
                    }}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all active:scale-95 text-sm"
                  >
                    Add Expense
                  </button>
                </div>
              </div>

              {/* Admin Requests Panel */}
              {selectedGroup.created_by_id === currentUser.id && groupRequests.length > 0 && (
                <GlassCard className="bg-amber-500/5 border-amber-500/20">
                  <h3 className="font-bold text-amber-500 mb-4 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4" /> Pending Requests ({groupRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {groupRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">
                            {req.name[0]}
                          </div>
                          <span className="text-sm font-medium">{req.name} <span className="opacity-50 text-xs">({req.email})</span></span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRequestAction(req.id, 'APPROVE')} className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/30 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleRequestAction(req.id, 'REJECT')} className="p-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Recent Expenses</h3>
                  {groupExpenses.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                      No expenses yet. Add one to get started!
                    </div>
                  ) : (
                    groupExpenses.map(expense => {
                      const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category) || EXPENSE_CATEGORIES[8];
                      const CategoryIcon = category.icon;
                      return (
                        <GlassCard key={expense.id} className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <CategoryIcon className="w-5 h-5" style={{ color: category.color }} />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{expense.description}</h4>
                              <p className="text-xs text-muted-foreground">Paid by {expense.paidBy.name}</p>
                            </div>
                          </div>
                          <span className="font-bold text-foreground">₹{expense.amount}</span>
                        </GlassCard>
                      );
                    })
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">Balances</h3>
                  <GlassCard>
                    {groupBalances.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-4xl mb-2">🎉</div>
                        <div className="text-muted-foreground text-sm">All settled up!</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groupBalances.map((b, i) => (
                          <div key={i} className="group">
                            <div className="flex items-center justify-between text-sm py-3 border-b border-border last:border-0">
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`font-semibold ${b.fromUserName === currentUser?.name ? 'text-primary' : 'text-foreground'}`}>{b.fromUserName === currentUser?.name ? 'You' : b.fromUserName}</span>
                                <span className="text-muted-foreground text-xs">owe{b.fromUserName === currentUser?.name ? '' : 's'}</span>
                                <span className={`font-semibold ${b.toUserName === currentUser?.name ? 'text-primary' : 'text-foreground'}`}>{b.toUserName === currentUser?.name ? 'you' : b.toUserName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-xs">₹{b.amount}</span>
                                <button
                                  onClick={() => handleSettleUp(b)}
                                  className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded hover:bg-emerald-600 transition-all flex items-center gap-1"
                                >
                                  <Zap className="w-3 h-3" /> Settle
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {/* Activity Feed Tab */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground px-1">
                    {monthlyStats.length > 0 ? `₹${monthlyStats[monthlyStats.length - 1]?.value || 0}` : '₹0'}
                  </p>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Active Groups</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground px-1">{groups.length}</p>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                  </div>
                  <p className={`text-2xl font-bold px-1 ${userBalances?.netBalance && userBalances.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {userBalances ? (userBalances.netBalance >= 0 ? '+' : '') + `₹${userBalances.netBalance}` : '₹0'}
                  </p>
                </GlassCard>
              </div>

              {/* Recent Transactions */}
              <GlassCard>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" /> Recent Transactions
                </h3>

                {groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No activity yet. Create or join a group to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupExpenses.slice(0, 10).map((expense, i) => {
                      const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category) || EXPENSE_CATEGORIES[8];
                      const CatIcon = category.icon;
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <CatIcon className="w-5 h-5" style={{ color: category.color }} />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">Paid by {expense.paidBy.name}</p>
                            </div>
                          </div>
                          <span className="font-bold text-foreground text-sm">₹{expense.amount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

              <GlassCard>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Profile
                </h3>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-3xl font-bold shadow-md border border-border">
                    {currentUser.name[0]}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">{currentUser.name}</h4>
                    <p className="text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Application
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <div>
                        <p className="font-medium text-foreground text-sm">Appearance</p>
                        <p className="text-xs text-muted-foreground capitalize">{theme} Theme</p>
                      </div>
                    </div>
                    <div className="flex bg-secondary p-1 rounded-lg">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-background shadow-sm text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Light Mode"
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Dark Mode"
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-background shadow-sm text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
                        title="System"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> About SlipWise
                </h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>Version 2.0.0 (Minimalist Edition)</p>
                  <p>SlipWise makes splitting expenses easy and fun.</p>
                  <div className="pt-4 border-t border-border">
                    <button className="text-red-400 hover:text-red-500 font-bold flex items-center gap-2" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {showAddExpense && selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card p-8 rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-foreground">Add New Expense</h3>
                  <button onClick={() => setShowAddExpense(false)}><X className="w-6 h-6 text-muted-foreground hover:text-foreground" /></button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Description</label>
                    <input
                      required
                      className="w-full bg-secondary/50 p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground text-sm"
                      placeholder="What was this for?"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Category</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {EXPENSE_CATEGORIES.map(cat => {
                        const CatIcon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setExpenseCategory(cat.id)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${expenseCategory === cat.id
                              ? 'border-2 shadow-sm'
                              : 'border-border hover:border-primary/50 bg-secondary/20'
                              }`}
                            style={{
                              borderColor: expenseCategory === cat.id ? cat.color : undefined,
                              backgroundColor: expenseCategory === cat.id ? `${cat.color}20` : undefined
                            }}
                          >
                            <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                            <span className="text-xs text-foreground opacity-80">{cat.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Amount</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full bg-secondary/50 p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground text-sm"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Paid By</label>
                      <select
                        className="w-full bg-secondary/50 p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground text-sm"
                        value={expensePayer}
                        onChange={(e) => setExpensePayer(e.target.value)}
                      >
                        {selectedGroup.members.map(m => (
                          <option key={m.user.id} value={m.user.id} className="bg-card text-foreground">
                            {m.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Split Method</label>
                    <div className="flex bg-secondary p-1 rounded-lg">
                      {(['EQUAL', 'EXACT', 'PERCENTAGE'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setExpenseSplitType(type)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${expenseSplitType === type ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {expenseSplitType !== 'EQUAL' && (
                    <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
                      {selectedGroup.members.map(m => (
                        <div key={m.user.id} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{m.user.name}</span>
                          <input
                            type="number"
                            placeholder={expenseSplitType === 'PERCENTAGE' ? '%' : 'Amount'}
                            className="w-32 p-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setExpenseSplits(prev => {
                                const others = prev.filter(p => p.userId !== m.user.id);
                                return [...others, {
                                  userId: m.user.id,
                                  [expenseSplitType === 'PERCENTAGE' ? 'percentage' : 'amount']: val
                                }];
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-sm mt-2">
                    Add Expense
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Avatar Selection Modal */}
        <AnimatePresence>
          {showAvatarModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAvatarModal(false)}
            >
              <div
                className="bg-card p-8 rounded-2xl border border-border w-full max-w-sm shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-foreground">Choose Avatar</h3>
                  <button onClick={() => setShowAvatarModal(false)}><X className="w-6 h-6 text-muted-foreground hover:text-foreground" /></button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {['🐼', '🦊', '🐯', '🦁', '🐰', '🐨', '🦄', '🐸', '🐙'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleUpdateAvatar(emoji)}
                      className={`text-4xl p-4 rounded-xl hover:bg-secondary transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-border flex items-center justify-center ${currentUser?.avatar === emoji ? 'bg-secondary border-primary/50' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div >
  );
}
