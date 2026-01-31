import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Search,
    User,
    Shield,
    CreditCard,
    Loader2,
    CheckCircle2,
    XCircle,
    UserCircle,
    Calendar,
    Settings2,
    Trash2
} from 'lucide-react';

interface UserProfile {
    id: string;
    display_name: string | null;
    role: string | null;
    subscription_status: string | null;
    plan_type: string | null;
    updated_at: string;
    email?: string;
    total_token_usage?: number;
}

interface UsageLog {
    id: string;
    user_id: string;
    model: string;
    total_tokens: number;
    request_path: string;
    created_at: string;
    profiles?: {
        display_name: string | null;
    };
}

export const UserManager = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [tiers, setTiers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchUsageLogs();
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            const { data, error } = await supabase
                .from('tiers')
                .select('*')
                .eq('is_active', true)
                .order('price_monthly', { ascending: true });

            if (error) throw error;
            setTiers(data || []);
        } catch (error: any) {
            console.error('Error fetching tiers:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Get profiles with tier information
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*, tiers(id, name, display_name)')
                .order('updated_at', { ascending: false });

            if (profileError) throw profileError;

            // Fetch usage summary from user_usage table
            const { data: usageData, error: usageError } = await supabase
                .from('user_usage')
                .select('user_id, total_tokens');

            if (usageError) {
                console.error('Error fetching usage data:', usageError);
            }

            // Aggregate usage by user_id
            const usageMap: Record<string, number> = {};
            if (usageData) {
                usageData.forEach((usage: any) => {
                    usageMap[usage.user_id] = usage.total_tokens || 0;
                });
            }

            const usersWithUsage = (profiles || []).map((user: any) => ({
                ...user,
                total_token_usage: usageMap[user.id] || 0,
                plan_type: user.tiers?.display_name || user.plan_type // Use tier name if available
            }));

            setUsers(usersWithUsage);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            alert('Failed to load users: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageLogs = async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*, profiles(display_name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setUsageLogs(data || []);
        } catch (error: any) {
            console.error('Error fetching usage logs:', error);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editingUser.role,
                    subscription_status: editingUser.subscription_status,
                    tier_id: editingUser.plan_type, // plan_type now holds tier_id from the form
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setEditingUser(null);
            fetchUsers();
            alert('User updated successfully');
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert('Failed to update user: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This will remove their profile and access settings.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            fetchUsers();
            alert('User profile deleted successfully');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user: ' + error.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">User Management</h1>
                    <p className="text-dark-400">Manage user accounts, roles, and subscriptions across the platform.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-dark-900 border border-dark-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg">
                {loading ? (
                    <div className="p-20 text-center text-dark-500">
                        <Loader2 className="mx-auto mb-4 animate-spin opacity-20" size={48} />
                        <p className="text-sm font-medium">Loading user directory...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-20 text-center text-dark-500">
                        <UserCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No users found matching your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dark-950/50 border-b border-dark-800">
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider">Usage</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-dark-500 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {filteredUsers.map((user: UserProfile) => (
                                    <tr key={user.id} className="group hover:bg-dark-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center border border-dark-700 group-hover:border-accent-cyan transition-colors text-dark-400 group-hover:text-accent-cyan">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{user.display_name || 'Anonymous'}</p>
                                                    <p className="text-xs text-dark-500 font-mono">{user.id.substring(0, 16)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${user.role === 'admin'
                                                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                                                : 'bg-dark-800 text-dark-400 border-dark-700'
                                                }`}>
                                                <Shield size={10} />
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    {user.subscription_status === 'active' ? (
                                                        <CheckCircle2 size={12} className="text-green-500" />
                                                    ) : (
                                                        <XCircle size={12} className="text-dark-500" />
                                                    )}
                                                    <span className={`text-xs font-medium ${user.subscription_status === 'active' ? 'text-green-400' : 'text-dark-400'}`}>
                                                        {user.subscription_status || 'inactive'}
                                                    </span>
                                                </div>
                                                {user.plan_type && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-dark-500 uppercase font-bold tracking-wider pl-4">
                                                        <CreditCard size={10} />
                                                        {user.plan_type}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-mono text-white">{(user.total_token_usage || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-dark-500 uppercase font-bold tracking-tight">Total Tokens</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-dark-400 text-xs">
                                                <Calendar size={12} />
                                                {new Date(user.updated_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser({
                                                        ...user,
                                                        plan_type: (user as any).tier_id || '' // Use tier_id for the dropdown
                                                    })}
                                                    className="p-2 text-dark-400 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    <Settings2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-dark-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Edit User Profile</h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-dark-500 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-dark-950/50 rounded-xl border border-dark-800">
                                <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center text-accent-cyan">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="font-bold">{editingUser.display_name || 'Anonymous User'}</p>
                                    <p className="text-xs text-dark-500 font-mono">{editingUser.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-dark-500 mb-2">User Role</label>
                                    <select
                                        value={editingUser.role || 'user'}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none"
                                    >
                                        <option value="user">Standard User</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-dark-500 mb-2">Tier</label>
                                    <select
                                        value={editingUser.plan_type || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, plan_type: e.target.value })}
                                        className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none"
                                    >
                                        <option value="">No Tier (Unlimited)</option>
                                        {tiers.map((tier) => (
                                            <option key={tier.id} value={tier.id}>
                                                {tier.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-dark-500 mb-2">Subscription Status</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser({ ...editingUser, subscription_status: 'active' })}
                                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all border ${editingUser.subscription_status === 'active'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-dark-950 text-dark-500 border-dark-800 hover:border-dark-700'
                                            }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser({ ...editingUser, subscription_status: 'inactive' })}
                                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all border ${editingUser.subscription_status === 'inactive'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-dark-950 text-dark-500 border-dark-800 hover:border-dark-700'
                                            }`}
                                    >
                                        Inactive
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 bg-dark-800 hover:bg-dark-700 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Save User Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Global Usage Logs */}
            <div className="space-y-4 pt-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Recent Usage Activity</h2>
                    <p className="text-dark-400 text-sm">Real-time monitoring of token consumption across all users.</p>
                </div>

                <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg">
                    {logsLoading ? (
                        <div className="p-10 text-center text-dark-500">
                            <Loader2 className="mx-auto mb-4 animate-spin opacity-20" size={32} />
                            <p className="text-sm font-medium">Loading activity logs...</p>
                        </div>
                    ) : usageLogs.length === 0 ? (
                        <div className="p-10 text-center text-dark-500">
                            <p className="text-sm font-medium">No usage logs found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-dark-950/50 border-b border-dark-800">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-dark-500 tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-dark-500 tracking-wider">User</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-dark-500 tracking-wider">Model</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-dark-500 tracking-wider">Tokens</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-dark-500 tracking-wider">Path</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-800">
                                    {usageLogs.map((log: UsageLog) => (
                                        <tr key={log.id} className="hover:bg-dark-800/30 transition-colors">
                                            <td className="px-6 py-3 text-xs text-dark-400 font-mono">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="text-xs font-bold text-white">{log.profiles?.display_name || 'System'}</p>
                                                <p className="text-[10px] text-dark-500 font-mono">{log.user_id.substring(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] bg-dark-800 text-accent-cyan px-2 py-0.5 rounded border border-dark-700 font-bold uppercase">
                                                    {log.model}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-xs font-mono text-white">
                                                {log.total_tokens.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-dark-500 font-mono">
                                                {log.request_path}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
