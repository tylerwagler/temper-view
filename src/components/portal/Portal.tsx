import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GPUDashboard } from '../GPUDashboard';
import {
    Key,
    CreditCard,
    LogOut,
    Plus,
    Trash2,
    Copy,
    CheckCircle2,
    ShieldCheck,
    Cpu,
    User as UserIcon,
    Users as UsersIcon,
    Loader2,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Layers
} from 'lucide-react';
import { UserManager } from './UserManager';
import { TierManager } from './TierManager';
import { ChatInterface } from './ChatInterface';

export const Portal = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [activeTab, setActiveTab] = useState<'keys' | 'billing' | 'settings' | 'hardware' | 'chat' | 'users' | 'tiers'>('chat');
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isAdmin = profile?.role === 'admin';

    const fetchProfile = async (userId: string) => {
        console.log('Fetching profile for:', userId);
        const { data, error } = await supabase
            .from('profiles')
            .select('*, tiers(display_name)')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            setError(`Profile load failed: ${error.message}`);
        } else if (data) {
            console.log('Profile loaded:', data);
            setProfile(data);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Refresh profile when changing tabs (to pick up tier changes from User Management)
    useEffect(() => {
        if (session?.user && (activeTab === 'keys' || activeTab === 'settings')) {
            fetchProfile(session.user.id);
        }
    }, [activeTab]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading && !session) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="p-3 bg-accent-cyan/10 rounded-xl border border-accent-cyan/20">
                            <ShieldCheck className="w-8 h-8 text-accent-cyan" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-dark-400 text-center mb-8 text-sm">
                        Access your AI stack management portal
                    </p>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-dark-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-cyan transition-colors"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-dark-500 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-cyan transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-dark-800 text-center">
                        <button
                            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                            className="text-accent-cyan hover:underline text-sm font-medium"
                        >
                            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-dark-950 text-white flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-dark-900 border-r border-dark-800 p-4 flex flex-col transition-all duration-300 ease-in-out relative group`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 bg-dark-800 border border-dark-700 text-dark-400 hover:text-accent-cyan p-1 rounded-full z-20 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-xl"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-10 px-2 pt-2`}>
                    <ShieldCheck className="w-6 h-6 text-accent-cyan flex-shrink-0" />
                    {!isCollapsed && <span className="font-bold text-lg whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">AI Portal v2.2</span>}
                </div>

                <nav className="flex-1 space-y-2">
                    <TabButton
                        active={activeTab === 'chat'}
                        onClick={() => setActiveTab('chat')}
                        icon={<MessageSquare size={18} />}
                        label="AI Chat"
                        collapsed={isCollapsed}
                    />
                    <TabButton
                        active={activeTab === 'keys'}
                        onClick={() => setActiveTab('keys')}
                        icon={<Key size={18} />}
                        label="API Keys"
                        collapsed={isCollapsed}
                    />
                    <TabButton
                        active={activeTab === 'billing'}
                        onClick={() => setActiveTab('billing')}
                        icon={<CreditCard size={18} />}
                        label="Billing"
                        collapsed={isCollapsed}
                    />
                    {isAdmin && (
                        <div className={`pt-4 mt-4 border-t border-dark-800/50 ${isCollapsed ? 'px-1' : ''}`}>
                            <TabButton
                                active={activeTab === 'hardware'}
                                onClick={() => setActiveTab('hardware')}
                                icon={<Cpu size={18} />}
                                label="Hardware"
                                collapsed={isCollapsed}
                            />
                            <TabButton
                                active={activeTab === 'users'}
                                onClick={() => setActiveTab('users')}
                                icon={<UsersIcon size={18} />}
                                label="User Management"
                                collapsed={isCollapsed}
                            />
                            <TabButton
                                active={activeTab === 'tiers'}
                                onClick={() => setActiveTab('tiers')}
                                icon={<Layers size={18} />}
                                label="Tier Management"
                                collapsed={isCollapsed}
                            />
                        </div>
                    )}
                </nav>

                <div className="pt-6 mt-6 border-t border-dark-800/50">
                    <div
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-2 mb-6 cursor-pointer hover:bg-dark-800/50 p-2 rounded-xl transition-colors select-none group/profile`}
                        onClick={() => setActiveTab('settings')}
                        title="Account Settings"
                    >
                        <div className="w-8 h-8 rounded-xl bg-dark-800 flex items-center justify-center border border-dark-700 flex-shrink-0 group-hover/profile:border-accent-cyan transition-colors">
                            <UserIcon size={16} className="text-dark-400 group-hover/profile:text-accent-cyan transition-colors" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="text-xs font-bold truncate text-dark-300 group-hover/profile:text-white transition-colors">{profile?.display_name || session.user.email}</p>
                                <p className="text-[10px] text-dark-500 uppercase tracking-wider font-bold">
                                    {profile?.tiers?.display_name || 'No Tier'}
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-dark-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors text-sm font-medium`}
                        title={isCollapsed ? "Sign Out" : ""}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            <main className={`flex-1 ${(activeTab === 'hardware' || activeTab === 'chat') ? 'overflow-hidden' : 'overflow-auto'} ${(activeTab === 'hardware' || activeTab === 'chat') ? 'p-0' : 'p-10'}`}>
                <div className={(activeTab === 'hardware' || activeTab === 'chat') ? 'w-full h-full' : 'max-w-4xl mx-auto'}>
                    {activeTab === 'keys' && <ApiKeyManager />}
                    {activeTab === 'billing' && (
                        <BillingSection
                            user={session.user}
                            profile={profile}
                        />
                    )}
                    {activeTab === 'settings' && (
                        <AccountSection
                            user={session.user}
                            profile={profile}
                            isAdmin={isAdmin}
                            onUpdateProfile={() => fetchProfile(session.user.id)}
                        />
                    )}
                    {activeTab === 'hardware' && (
                        <GPUDashboard hideHeader isAdmin={isAdmin} session={session} />
                    )}
                    {activeTab === 'chat' && <ChatInterface />}
                    {activeTab === 'users' && <UserManager />}
                    {activeTab === 'tiers' && <TierManager />}
                </div>
            </main>
        </div>
    );
};

const UsageBar = ({ label, used, limit }: { label: string, used: number, limit: number }) => {
    const percentage = Math.min(Math.round((used / limit) * 100), 100);
    const isWarning = percentage > 80;
    const isCritical = percentage > 95;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider font-mono">{label}</span>
                <span className={`text-[10px] font-mono font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-dark-400'}`}>
                    {used.toLocaleString()} / {limit.toLocaleString()}
                </span>
            </div>
            <div className="h-1 w-full bg-dark-800 rounded-full overflow-hidden border border-dark-700/50">
                <div
                    className={`h-full transition-all duration-500 rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-accent-cyan'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, collapsed }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-2 rounded-lg transition-all ${active
            ? 'bg-accent-cyan/10 text-accent-cyan'
            : 'text-dark-400 hover:text-white hover:bg-dark-800'
            } text-sm font-medium relative group/tab`}
        title={collapsed ? label : ""}
    >
        <div className="flex-shrink-0 transition-transform duration-200 group-hover/tab:scale-110">
            {icon}
        </div>
        {!collapsed && (
            <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                {label}
            </span>
        )}
        {active && collapsed && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-cyan rounded-l-full" />
        )}
    </button>
);

const ApiKeyManager = () => {
    const [keys, setKeys] = useState<any[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userTier, setUserTier] = useState<any>(null);
    const [userUsage, setUserUsage] = useState<any>(null);
    const [keyUsage, setKeyUsage] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchKeys();
        fetchUserTierAndUsage();
        fetchKeyUsage();
    }, []);

    const fetchKeyUsage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get per-key usage from usage_logs
        const { data, error } = await supabase
            .from('usage_logs')
            .select('api_key_id, total_tokens');

        if (error) {
            console.error('Error fetching key usage:', error);
            return;
        }

        // Aggregate by api_key_id
        const usageMap: Record<string, number> = {};
        if (data) {
            data.forEach((log: any) => {
                usageMap[log.api_key_id] = (usageMap[log.api_key_id] || 0) + (log.total_tokens || 0);
            });
        }
        setKeyUsage(usageMap);
    };

    const fetchUserTierAndUsage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user's tier
        const { data: profileData } = await supabase
            .from('profiles')
            .select('tier_id, tiers(display_name, description, hourly_limit, daily_limit, weekly_limit, monthly_limit, rate_limit_rpm, rate_limit_tpm)')
            .eq('id', user.id)
            .single();

        if (profileData) {
            setUserTier(profileData.tiers);
        }

        // Fetch user's aggregated usage
        const { data: usageData } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (usageData) {
            setUserUsage(usageData);
        }
    };

    const fetchKeys = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching keys:', error);
        } else {
            setKeys(data || []);
        }
        setIsLoading(false);
    };

    const createKey = async () => {
        if (!newKeyName.trim()) return;

        const key = `sk_ai_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('api_keys')
            .insert([
                {
                    name: newKeyName,
                    api_key: key,
                    user_id: user.id
                }
            ]);

        if (error) {
            console.error('Error creating key:', error);
            alert('Failed to create API key');
        } else {
            setGeneratedKey(key);
            setNewKeyName('');
            fetchKeys();
        }
    };

    const deleteKey = async (id: string) => {
        // Check if this is the WebChat key
        const keyToDelete = keys.find(k => k.id === id);
        if (keyToDelete?.name === 'WebChat') {
            alert('The WebChat API key cannot be deleted. It is required for the web chat interface.');
            return;
        }

        if (!confirm('Are you sure you want to delete this API key?')) return;

        const { error } = await supabase
            .from('api_keys')
            .delete()
            .match({ id });

        if (error) {
            console.error('Error deleting key:', error);
            alert('Failed to delete API key');
        } else {
            fetchKeys();
        }
    };

    const formatLimit = (limit: number) => {
        if (limit === -1) return 'Unlimited';
        if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
        if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
        return limit.toString();
    };

    const getResetTime = (resetDate: string, period: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
        if (!resetDate) return 'Unknown';
        const reset = new Date(resetDate);
        const now = new Date();

        let periodMs: number;
        if (period === 'hourly') {
            periodMs = 60 * 60 * 1000;
        } else if (period === 'daily') {
            periodMs = 24 * 60 * 60 * 1000;
        } else if (period === 'weekly') {
            periodMs = 7 * 24 * 60 * 60 * 1000;
        } else {
            periodMs = 30 * 24 * 60 * 60 * 1000;
        }

        const nextReset = new Date(reset.getTime() + periodMs);
        const diff = nextReset.getTime() - now.getTime();

        // If reset time has passed, calculate time since it should have reset
        if (diff < 0) {
            const overdue = Math.abs(diff);
            const hours = Math.floor(overdue / (1000 * 60 * 60));
            const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                return `Overdue ${days}d`;
            } else if (hours > 0) {
                return `Overdue ${hours}h`;
            } else {
                return `Overdue ${minutes}m`;
            }
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">API Keys</h1>
                <p className="text-dark-400">Keys for authenticating your requests to the AI stack.</p>
            </div>

            {/* User Tier and Usage Summary */}
            {userTier && userUsage && (
                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{userTier.display_name} Tier</h3>
                            {userTier.description && (
                                <p className="text-sm text-dark-400">{userTier.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-accent-cyan bg-accent-cyan/10 px-4 py-2 rounded-lg border border-accent-cyan/20">
                            <Layers size={18} />
                            <span className="text-sm font-bold">Current Plan</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        <div>
                            {userTier.hourly_limit > 0 ? (
                                <>
                                    <UsageBar
                                        label="Hourly"
                                        used={userUsage.hourly_usage || 0}
                                        limit={userTier.hourly_limit}
                                    />
                                    <p className="text-[9px] text-dark-500 mt-1.5 font-mono">
                                        Resets in {getResetTime(userUsage.hourly_reset_at, 'hourly')}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider font-mono">Hourly</span>
                                        <span className="text-[10px] font-mono font-bold text-dark-400">
                                            {(userUsage.hourly_usage || 0).toLocaleString()} / Unlimited
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-dark-500 font-mono">
                                        Resets in {getResetTime(userUsage.hourly_reset_at, 'hourly')}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            {userTier.daily_limit > 0 ? (
                                <>
                                    <UsageBar
                                        label="Daily"
                                        used={userUsage.daily_usage || 0}
                                        limit={userTier.daily_limit}
                                    />
                                    <p className="text-[9px] text-dark-500 mt-1.5 font-mono">
                                        Resets in {getResetTime(userUsage.daily_reset_at, 'daily')}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider font-mono">Daily</span>
                                        <span className="text-[10px] font-mono font-bold text-dark-400">
                                            {(userUsage.daily_usage || 0).toLocaleString()} / Unlimited
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-dark-500 font-mono">
                                        Resets in {getResetTime(userUsage.daily_reset_at, 'daily')}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            {userTier.weekly_limit > 0 ? (
                                <>
                                    <UsageBar
                                        label="Weekly"
                                        used={userUsage.weekly_usage || 0}
                                        limit={userTier.weekly_limit}
                                    />
                                    <p className="text-[9px] text-dark-500 mt-1.5 font-mono">
                                        Resets in {getResetTime(userUsage.weekly_reset_at, 'weekly')}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider font-mono">Weekly</span>
                                        <span className="text-[10px] font-mono font-bold text-dark-400">
                                            {(userUsage.weekly_usage || 0).toLocaleString()} / Unlimited
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-dark-500 font-mono">
                                        Resets in {getResetTime(userUsage.weekly_reset_at, 'weekly')}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            {userTier.monthly_limit > 0 ? (
                                <>
                                    <UsageBar
                                        label="Monthly"
                                        used={userUsage.monthly_usage || 0}
                                        limit={userTier.monthly_limit}
                                    />
                                    <p className="text-[9px] text-dark-500 mt-1.5 font-mono">
                                        Resets in {getResetTime(userUsage.monthly_reset_at, 'monthly')}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider font-mono">Monthly</span>
                                        <span className="text-[10px] font-mono font-bold text-dark-400">
                                            {(userUsage.monthly_usage || 0).toLocaleString()} / Unlimited
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-dark-500 font-mono">
                                        Resets in {getResetTime(userUsage.monthly_reset_at, 'monthly')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-dark-800/50 grid grid-cols-5 gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Total Tokens</p>
                            <p className="text-lg font-mono text-white">{(userUsage.total_tokens || 0).toLocaleString()}</p>
                        </div>
                        {userTier.hourly_limit !== -1 && (
                            <div>
                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Hourly Limit</p>
                                <p className="text-sm font-mono text-dark-300">{formatLimit(userTier.hourly_limit)}</p>
                            </div>
                        )}
                        {userTier.daily_limit !== -1 && (
                            <div>
                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Daily Limit</p>
                                <p className="text-sm font-mono text-dark-300">{formatLimit(userTier.daily_limit)}</p>
                            </div>
                        )}
                        {userTier.weekly_limit !== -1 && (
                            <div>
                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Weekly Limit</p>
                                <p className="text-sm font-mono text-dark-300">{formatLimit(userTier.weekly_limit)}</p>
                            </div>
                        )}
                        {userTier.monthly_limit !== -1 && (
                            <div>
                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Monthly Limit</p>
                                <p className="text-sm font-mono text-dark-300">{formatLimit(userTier.monthly_limit)}</p>
                            </div>
                        )}
                        {userTier.rate_limit_rpm !== -1 && (
                            <div>
                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Rate Limit</p>
                                <p className="text-sm font-mono text-dark-300">{userTier.rate_limit_rpm} RPM</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-900/50">
                    <h3 className="font-bold text-sm uppercase text-dark-500 tracking-wider">Your Active Keys</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Key Name"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                        />
                        <button
                            onClick={createKey}
                            className="bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 transition-transform active:scale-95"
                        >
                            <Plus size={14} />
                            New Key
                        </button>
                    </div>
                </div>

                {generatedKey && (
                    <div className="p-6 bg-accent-cyan/5 border-b border-dark-800 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-accent-cyan mb-2">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-bold uppercase">New Key Generated</span>
                        </div>
                        <p className="text-xs text-dark-400 mb-4 font-medium italic">Make sure to copy this key now. You won't be able to see it again.</p>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={generatedKey}
                                className="flex-1 bg-dark-950 border border-accent-cyan/30 rounded-lg px-4 py-2 font-mono text-sm text-accent-cyan select-all"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedKey)}
                                className="bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan rounded-lg px-4 py-2 transition-colors"
                                title="Copy to clipboard"
                            >
                                <Copy size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="p-12 text-center text-dark-500">
                        <Loader2 className="mx-auto mb-4 animate-spin opacity-20" size={48} />
                        <p className="text-sm font-medium">Loading your API keys...</p>
                    </div>
                ) : keys.length === 0 ? (
                    <div className="p-12 text-center text-dark-500">
                        <Key size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No API keys yet. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-800">
                        {keys.map((key) => {
                            const isWebChatKey = key.name === 'WebChat';
                            return (
                                <div key={key.id} className="p-6 group hover:bg-dark-800/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white group-hover:text-accent-cyan transition-colors">{key.name}</h4>
                                                {isWebChatKey && (
                                                    <span className="bg-accent-cyan/10 text-accent-cyan text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-accent-cyan/20">
                                                        Web Chat
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-dark-500">
                                                <span className="font-mono bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700">
                                                    {key.api_key.substring(0, 6)}••••{key.api_key.slice(-4)}
                                                </span>
                                                <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                                                {key.last_used_at && (
                                                    <span>• Last used {new Date(key.last_used_at).toLocaleTimeString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-dark-500 mb-0.5">Key Usage</p>
                                                <p className="text-sm font-mono text-white">{(keyUsage[key.id] || 0).toLocaleString()}</p>
                                                <p className="text-[9px] text-dark-500">tokens</p>
                                            </div>
                                            {!isWebChatKey ? (
                                                <button
                                                    onClick={() => deleteKey(key.id)}
                                                    className="text-dark-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete key"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <div className="w-[42px]"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const BillingSection = ({ user, profile }: any) => {
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleUpgrade = async (priceId: string) => {
        setIsRedirecting(true);
        try {
            const response = await fetch('/api/billing/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    user_email: user.email,
                    price_id: priceId
                })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.detail || 'Failed to create checkout session');
            }
        } catch (err: any) {
            console.error('Upgrade error:', err);
            alert(`Billing Error: ${err.message}`);
            setIsRedirecting(false);
        }
    };

    const handleManageBilling = async () => {
        setIsRedirecting(true);
        try {
            const response = await fetch('/api/billing/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.detail || 'Stripe customer not found or portal error');
            }
        } catch (err: any) {
            console.error('Portal error:', err);
            alert(`Billing Error: ${err.message}`);
            setIsRedirecting(false);
        }
    };

    const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Billing & Plan</h1>
                <p className="text-dark-400">Manage your subscription and usage limits.</p>
            </div>

            {isSubscribed ? (
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-xs font-bold uppercase text-dark-500 mb-6 tracking-widest">Current Plan</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-white italic">
                                {(profile?.tiers?.display_name || 'PRO').toUpperCase()}
                            </span>
                            <span className="text-dark-500 text-sm">/ tier</span>
                        </div>
                        <p className="text-dark-400 text-sm mb-8 leading-relaxed">
                            Priority inference, detailed performance analytics, and unlimited model swapping enabled.
                        </p>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm font-medium text-center">
                            Your subscription is active!
                        </div>
                    </div>

                    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <CreditCard size={120} />
                        </div>
                        <h3 className="text-xs font-bold uppercase text-dark-500 mb-6 tracking-widest">Payment Method</h3>
                        <div className="mt-4 text-center py-10">
                            <p className="text-dark-400 text-sm mb-4">Manage your payment methods and invoices</p>
                            <button
                                onClick={handleManageBilling}
                                disabled={isRedirecting}
                                className="text-accent-cyan text-sm font-bold flex items-center gap-2 mx-auto hover:underline disabled:opacity-50"
                            >
                                {isRedirecting ? <Loader2 size={16} className="animate-spin" /> : 'Open Billing Portal'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6">
                    {/* Pro Plan */}
                    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg hover:border-accent-cyan/50 transition-all">
                        <h3 className="text-xs font-bold uppercase text-dark-500 mb-4 tracking-widest">Pro Plan</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-white">PRO</span>
                        </div>
                        <p className="text-dark-400 text-sm mb-6 leading-relaxed">
                            Priority inference access with enhanced performance analytics and model swapping.
                        </p>
                        <button
                            onClick={() => handleUpgrade('price_1Sv32rDNaJU3OXpntborxKFa')}
                            disabled={isRedirecting}
                            className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isRedirecting ? <Loader2 size={18} className="animate-spin" /> : 'Upgrade to Pro'}
                        </button>
                    </div>

                    {/* Ultimate Plan */}
                    <div className="bg-dark-900 border-2 border-accent-cyan/30 rounded-2xl p-6 shadow-lg hover:border-accent-cyan transition-all relative">
                        <div className="absolute top-4 right-4 bg-accent-cyan text-dark-950 text-[10px] font-bold px-2 py-1 rounded uppercase">
                            Best Value
                        </div>
                        <h3 className="text-xs font-bold uppercase text-dark-500 mb-4 tracking-widest">Ultimate Plan</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-accent-cyan">ULTIMATE</span>
                        </div>
                        <p className="text-dark-400 text-sm mb-6 leading-relaxed">
                            Maximum performance with unlimited access, priority support, and exclusive features.
                        </p>
                        <button
                            onClick={() => handleUpgrade('price_1Sv33IDNaJU3OXpn8vyU7frY')}
                            disabled={isRedirecting}
                            className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isRedirecting ? <Loader2 size={18} className="animate-spin" /> : 'Upgrade to Ultimate'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AccountSection = ({ user, profile, onUpdateProfile, isAdmin }: any) => {
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Synchronize local state when profile is finally loaded
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setTimezone(profile.timezone || 'UTC');
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    timezone: timezone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            if (onUpdateProfile) onUpdateProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
                <p className="text-dark-400">Settings for your account profile and security.</p>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-lg space-y-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center border border-dark-700">
                        <UserIcon size={40} className="text-dark-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1 text-white">{user.email}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-dark-500 text-sm">User ID: {user.id}</p>
                            {isAdmin && (
                                <span className="bg-accent-cyan/10 text-accent-cyan text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-accent-cyan/20">Admin</span>
                            )}
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-sm font-medium animate-in zoom-in-95 duration-200`}>
                        {message.text}
                    </div>
                )}

                <div className="pt-8 border-t border-dark-800 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold uppercase text-dark-500 mb-2 tracking-wider">Display Name</label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors"
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-dark-500 mb-2 tracking-wider">Timezone</label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none"
                            >
                                <option value="UTC">UTC (Coordinated Universal Time)</option>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="Europe/London">London (GMT/BST)</option>
                                <option value="Europe/Paris">Paris (CET/CEST)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-accent-cyan hover:bg-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed text-dark-950 px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-accent-cyan/20"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-dark-800 flex justify-between items-center">
                    <div className="text-dark-500 text-[11px] leading-relaxed max-w-sm">
                        Deleting your account is permanent and cannot be undone. All your data, including API keys and history, will be wiped from our servers.
                    </div>
                    <button className="text-dark-500 hover:text-red-500 text-xs font-bold flex items-center gap-2 hover:bg-red-500/5 px-4 py-2 rounded-lg transition-colors">
                        <Trash2 size={16} />
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

