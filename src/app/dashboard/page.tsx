
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Wallet, Users, Plus, ArrowUpRight, ArrowDownLeft, LogOut,
  CreditCard, Grid, Activity, Settings, Moon, Sun, Copy, Check, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Types ---
interface UserBalanceSummary {
  userId: string;
  userName: string;
  totalOwes: number;
  totalOwed: number;
  netBalance: number;
}

type User = { id: string; name: string; email: string };
type Group = { id: string; name: string; joinCode: string; created_by_id: string; members: { user: User }[]; _count?: { expenses: number } };
type Expense = { id: string; description: string; amount: number; paidBy: User; splitType: string; splits: any[]; createdAt: string };
type Balance = { fromUserName: string; toUserName: string; amount: number };
type Request = { id: string; user_id: string; name: string; email: string; created_at: string };

// --- Components ---

const GlassCard = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`backdrop-blur-xl border rounded-3xl p-6 transition-all shadow-lg ${className}`}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'groups' | 'activity'>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [groupBalances, setGroupBalances] = useState<Balance[]>([]);
  const [groupRequests, setGroupRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState<'EQUAL' | 'EXACT' | 'PERCENTAGE'>('EQUAL');
  const [expenseSplits, setExpenseSplits] = useState<{ userId: string; amount?: number; percentage?: number }[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    fetchSession();
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [userBalances, setUserBalances] = useState<UserBalanceSummary | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<{ name: string; value: number }[]>([]);
  const [groupStats, setGroupStats] = useState<{ name: string; value: number }[]>([]);

  // --- Actions ---
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
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
          setGroups(data);
        } else {
          console.error('Groups API did not return an array:', data);
          setGroups([]);
        }
      } else {
        console.error('Failed to fetch groups:', res.status);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
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
        // If admin, fetch requests
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

    // Basic Validation
    let payerId = expensePayer;
    if (!payerId && currentUser) payerId = currentUser.id;

    if (!expenseDesc || !expenseAmount || !payerId) {
      toast.error('Please fill in all fields');
      return;
    }

    // Default splits if empty (for EQUAL)
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
          splits: splitsToSubmit
        })
      });

      if (res.ok) {
        toast.success('Expense added!');
        setShowAddExpense(false);
        // Reset form
        setExpenseDesc('');
        setExpenseAmount('');
        setExpensePayer(currentUser?.id || '');
        setExpenseSplits([]);
        setExpenseSplitType('EQUAL');

        // Update data
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Join code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- Charts Data ---
  const chartData = [
    { name: 'Food', value: 400 },
    { name: 'Travel', value: 300 },
    { name: 'Rent', value: 300 },
    { name: 'Others', value: 200 },
  ];
  const COLORS = ['#E8D1C5', '#A4907C', '#D4C5B0', '#57595B'];

  // Theme Colors
  const bgMain = theme === 'dark' ? 'bg-[#452829]' : 'bg-[#e0d6ce]';
  const textMain = theme === 'dark' ? 'text-[#F3E8DF]' : 'text-[#452829]';
  const sidebarBg = theme === 'dark' ? 'bg-[#57595B]/10' : 'bg-white/40';
  const accentText = theme === 'dark' ? 'text-[#E8D1C5]' : 'text-[#7d685a]';

  // Card styles - glassmorphism
  const cardStyle = theme === 'dark'
    ? 'bg-[#57595B]/10 border-[#E8D1C5]/10 hover:border-[#E8D1C5]/20'
    : 'bg-white/60 border-white/40 hover:border-white/80 shadow-sm';

  if (!currentUser) return null;

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} flex transition-colors duration-500`}>
      <Toaster position="bottom-right" />

      {/* Sidebar */}
      <aside className={`w-64 ${sidebarBg} backdrop-blur-xl border-r border-[#E8D1C5]/10 p-6 flex flex-col hidden md:flex transition-colors`}>
        <h1 className={`text-2xl font-bold ${accentText} mb-12 flex items-center gap-2`}>
          <Wallet className="w-8 h-8" /> SlipWise
        </h1>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedGroup(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#E8D1C5] text-[#452829] font-bold shadow-lg shadow-[#E8D1C5]/20' : `hover:bg-[#E8D1C5]/10 ${accentText}`}`}
          >
            <Grid className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-[#E8D1C5] text-[#452829] font-bold shadow-lg shadow-[#E8D1C5]/20' : `hover:bg-[#E8D1C5]/10 ${accentText}`}`}
          >
            <Users className="w-5 h-5" /> Groups
          </button>
        </nav>

        <div className="pt-6 border-t border-[#E8D1C5]/10 space-y-4">
          <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-2 ${accentText} hover:bg-[#E8D1C5]/10 rounded-lg transition-colors`}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className="flex items-center gap-3 px-4 py-3 bg-[#E8D1C5]/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#E8D1C5] text-[#452829] flex items-center justify-center font-bold shadow-md">
              {currentUser.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold truncate">{currentUser.name}</p>
              <p className={`text-xs ${accentText} truncate opacity-60`}>{currentUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={`w-full flex items-center gap-2 px-4 py-2 ${accentText} opacity-60 hover:opacity-100 transition-opacity`}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 md:hidden">
          <h1 className="text-2xl font-bold text-[#E8D1C5]">SlipWise</h1>
          <button onClick={handleLogout}><LogOut className="w-6 h-6" /></button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className={`text-3xl font-bold mb-6 ${accentText}`}>Overview</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className={`${cardStyle} bg-gradient-to-br from-[#E8D1C5]/20 to-transparent`}>
                  <h3 className={`${accentText} mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider`}><ArrowUpRight className="w-4 h-4" /> You Owe</h3>
                  <p className={`text-4xl font-bold ${accentText}`}>
                    {userBalances ? `₹${userBalances.totalOwes}` : '...'}
                  </p>
                </GlassCard>
                <GlassCard className={`${cardStyle}`}>
                  <h3 className={`${accentText} mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider`}><ArrowDownLeft className="w-4 h-4" /> Owed to You</h3>
                  <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-[#b4a08f]' : 'text-[#8b7355]'}`}>
                    {userBalances ? `₹${userBalances.totalOwed}` : '...'}
                  </p>
                </GlassCard>
                <GlassCard className={`${cardStyle}`}>
                  <h3 className={`${accentText} mb-2 text-sm font-semibold uppercase tracking-wider`}>Total Balance</h3>
                  <p className={`text-4xl font-bold ${(userBalances?.netBalance || 0) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {userBalances ? (userBalances.netBalance >= 0 ? '+' : '') + `₹${userBalances.netBalance}` : '...'}
                  </p>
                </GlassCard>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className={`${cardStyle} h-[400px]`}>
                  <h3 className={`text-xl font-bold mb-6 ${accentText}`}>Monthly Spending</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={monthlyStats}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8D1C5" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#E8D1C5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke={theme === 'dark' ? "#E8D1C5" : "#452829"} opacity={0.5} />
                      <YAxis stroke={theme === 'dark' ? "#E8D1C5" : "#452829"} opacity={0.5} />
                      <Tooltip
                        contentStyle={{ backgroundColor: theme === 'dark' ? '#452829' : '#fff', border: '1px solid #E8D1C5' }}
                        itemStyle={{ color: theme === 'dark' ? '#F3E8DF' : '#452829' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#E8D1C5" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard className={`${cardStyle} h-[400px]`}>
                  <h3 className={`text-xl font-bold mb-6 ${accentText}`}>Expenses by Group</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={groupStats}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {groupStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'groups' && !selectedGroup && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-bold ${accentText}`}>Your Groups</h2>
                <div className="flex gap-4">
                  <button onClick={() => setShowJoinGroup(true)} className={`px-4 py-2 ${theme === 'dark' ? 'bg-[#57595B]/30' : 'bg-white/50'} rounded-xl hover:bg-[#57595B]/50 transition-all border border-[#E8D1C5]/10`}>
                    Join via Code
                  </button>
                  <button onClick={() => setShowCreateGroup(true)} className="px-4 py-2 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all flex items-center gap-2 shadow-lg shadow-[#E8D1C5]/20">
                    <Plus className="w-5 h-5" /> Create Group
                  </button>
                </div>
              </div>

              {/* Create Group Modal */}
              <AnimatePresence>
                {showCreateGroup && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <div className={`${theme === 'dark' ? 'bg-[#452829]' : 'bg-[#F3E8DF]'} p-8 rounded-3xl border border-[#E8D1C5]/20 w-full max-w-md shadow-2xl`}>
                      <h3 className={`text-2xl font-bold mb-6 ${accentText}`}>Create New Group</h3>
                      <input
                        className={`w-full ${theme === 'dark' ? 'bg-[#57595B]/20' : 'bg-white/50'} p-4 rounded-xl border border-[#E8D1C5]/10 mb-6 focus:outline-none focus:border-[#E8D1C5] transition-all ${textMain}`}
                        placeholder="Group Name (e.g. Summer Trip)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 hover:bg-[#57595B]/20 rounded-lg">Cancel</button>
                        <button onClick={handleCreateGroup} className="px-6 py-2 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold">Create</button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {showJoinGroup && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    <div className={`${theme === 'dark' ? 'bg-[#452829]' : 'bg-[#F3E8DF]'} p-8 rounded-3xl border border-[#E8D1C5]/20 w-full max-w-md shadow-2xl`}>
                      <h3 className={`text-2xl font-bold mb-6 ${accentText}`}>Join Group</h3>
                      <input
                        className={`w-full ${theme === 'dark' ? 'bg-[#57595B]/20' : 'bg-white/50'} p-4 rounded-xl border border-[#E8D1C5]/10 mb-6 focus:outline-none focus:border-[#E8D1C5] transition-all font-mono tracking-widest text-center text-xl uppercase ${textMain}`}
                        placeholder="ENTER CODE"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowJoinGroup(false)} className="px-4 py-2 hover:bg-[#57595B]/20 rounded-lg">Cancel</button>
                        <button onClick={handleJoinGroup} className="px-6 py-2 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold">Join</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>





              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                  <GlassCard key={group.id} className={`${cardStyle} cursor-pointer group relative overflow-hidden`} onClick={() => fetchGroupDetails(group.id)}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#E8D1C5]/10 flex items-center justify-center text-[#E8D1C5]">
                        <Users className="w-6 h-6" />
                      </div>
                      <button
                        onClick={(e) => handleCopyCode(group.joinCode, e)}
                        className="text-xs font-mono bg-[#57595B]/30 px-2 py-1 rounded text-[#E8D1C5]/60 flex items-center gap-1 hover:bg-[#E8D1C5] hover:text-[#452829] transition-all"
                      >
                        {copiedCode === group.joinCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {group.joinCode}
                      </button>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${accentText}`}>{group.name}</h3>
                    <div className="flex -space-x-2 mb-4">
                      {group.members.slice(0, 4).map((m, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-[#57595B] border-2 border-[#452829] flex items-center justify-center text-xs font-bold text-white shadow-lg" title={m.user.name}>
                          {m.user.name[0]}
                        </div>
                      ))}
                      {group.members.length > 4 && <div className="w-8 h-8 rounded-full bg-[#57595B] border-2 border-[#452829] flex items-center justify-center text-xs font-bold text-white shadow-lg">+{group.members.length - 4}</div>}
                    </div>

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#E8D1C5]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
              <button onClick={() => setSelectedGroup(null)} className={`${accentText} hover:opacity-100 opacity-60 flex items-center gap-2 mb-6 transition-opacity`}>
                &larr; Back to Groups
              </button>

              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-4xl font-bold mb-2 ${accentText}`}>{selectedGroup.name}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(selectedGroup.joinCode)}
                      className="px-3 py-1 rounded-lg bg-[#57595B]/20 font-mono tracking-widest text-[#E8D1C5] border border-[#E8D1C5]/10 hover:bg-[#E8D1C5] hover:text-[#452829] transition-all flex items-center gap-2"
                    >
                      {selectedGroup.joinCode}
                      {copiedCode === selectedGroup.joinCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <span className="text-xs opacity-50">Share this code to invite others</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExpensePayer(currentUser.id); // Default to current user
                    setShowAddExpense(true);
                  }}
                  className="px-6 py-3 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold shadow-lg shadow-[#E8D1C5]/10 hover:shadow-[#E8D1C5]/30 hover:scale-105 transition-all active:scale-95"
                >
                  Add Expense
                </button>
              </div>

              {/* Admin Requests Panel */}
              {selectedGroup.created_by_id === currentUser.id && groupRequests.length > 0 && (
                <GlassCard className="bg-yellow-500/5 border-yellow-500/20">
                  <h3 className="font-bold text-yellow-500 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Pending Requests ({groupRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {groupRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                            {req.name[0]}
                          </div>
                          <span>{req.name} <span className="opacity-50 text-xs">({req.email})</span></span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRequestAction(req.id, 'APPROVE')} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleRequestAction(req.id, 'REJECT')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className={`text-xl font-bold ${accentText}`}>Recent Expenses</h3>
                  {groupExpenses.length === 0 ? (
                    <div className={`p-8 rounded-2xl border border-dashed border-[#E8D1C5]/20 text-center ${accentText} opacity-50`}>
                      No expenses yet. Add one to get started!
                    </div>
                  ) : (
                    groupExpenses.map(expense => (
                      <GlassCard key={expense.id} className={`${cardStyle} flex justify-between items-center`}>
                        <div>
                          <h4 className={`font-bold ${textMain}`}>{expense.description}</h4>
                          <p className={`text-sm ${accentText} opacity-60`}>Paid by {expense.paidBy.name}</p>
                        </div>
                        <span className={`font-bold text-lg ${textMain}`}>₹{expense.amount}</span>
                      </GlassCard>
                    ))
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${accentText} mb-4`}>Balances</h3>
                  <GlassCard className={cardStyle}>
                    {groupBalances.length === 0 ? (
                      <div className="text-center py-4 opacity-50">All settled up! 🎉</div>
                    ) : (
                      groupBalances.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-3 border-b border-[#E8D1C5]/10 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${textMain}`}>{b.fromUserName === currentUser?.name ? 'You' : b.fromUserName}</span>
                            <span className={`${accentText} opacity-60`}>owe</span>
                            <span className={`font-bold ${textMain}`}>{b.toUserName === currentUser?.name ? 'you' : b.toUserName}</span>
                          </div>
                          <span className="font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">₹{b.amount}</span>
                        </div>
                      ))
                    )}
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {showAddExpense && selectedGroup && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className={`${theme === 'dark' ? 'bg-[#452829]' : 'bg-[#F3E8DF]'} p-8 rounded-3xl border border-[#E8D1C5]/20 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-2xl font-bold ${accentText}`}>Add New Expense</h3>
                  <button onClick={() => setShowAddExpense(false)}><X className={`w-6 h-6 ${textMain}`} /></button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${accentText}`}>Description</label>
                    <input
                      required
                      className={`w-full ${theme === 'dark' ? 'bg-[#57595B]/20' : 'bg-white/50'} p-4 rounded-xl border border-[#E8D1C5]/10 focus:outline-none focus:border-[#E8D1C5] transition-all ${textMain}`}
                      placeholder="What was this for?"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${accentText}`}>Amount</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className={`w-full ${theme === 'dark' ? 'bg-[#57595B]/20' : 'bg-white/50'} p-4 rounded-xl border border-[#E8D1C5]/10 focus:outline-none focus:border-[#E8D1C5] transition-all ${textMain}`}
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${accentText}`}>Paid By</label>
                      <select
                        className={`w-full ${theme === 'dark' ? 'bg-[#57595B]/20' : 'bg-white/50'} p-4 rounded-xl border border-[#E8D1C5]/10 focus:outline-none focus:border-[#E8D1C5] transition-all ${textMain}`}
                        value={expensePayer}
                        onChange={(e) => setExpensePayer(e.target.value)}
                      >
                        {selectedGroup.members.map(m => (
                          <option key={m.user.id} value={m.user.id} className="text-black">
                            {m.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-bold mb-2 ${accentText}`}>Split Method</label>
                    <div className="flex bg-[#57595B]/20 p-1 rounded-xl">
                      {(['EQUAL', 'EXACT', 'PERCENTAGE'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setExpenseSplitType(type)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${expenseSplitType === type ? 'bg-[#E8D1C5] text-[#452829]' : `${accentText} hover:bg-white/5`}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Details (Simplified for Equal, Detailed for others) */}
                  {expenseSplitType !== 'EQUAL' && (
                    <div className="space-y-3 p-4 bg-[#57595B]/10 rounded-xl">
                      {selectedGroup.members.map(m => {
                        // Find existing split val
                        const split = expenseSplits.find(s => s.userId === m.user.id) || {};
                        return (
                          <div key={m.user.id} className="flex items-center justify-between">
                            <span className={textMain}>{m.user.name}</span>
                            <input
                              type="number"
                              placeholder={expenseSplitType === 'PERCENTAGE' ? '%' : 'Amount'}
                              className={`w-32 p-2 rounded-lg ${theme === 'dark' ? 'bg-[#452829]' : 'bg-white'} border border-[#E8D1C5]/20 ${textMain}`}
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
                        );
                      })}
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 bg-[#E8D1C5] text-[#452829] rounded-xl font-bold hover:bg-[#F3E8DF] transition-all shadow-lg">
                    Add Expense
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div >
  );
}
