import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, X, Trash2, Loader2, DollarSign, Settings } from 'lucide-react';

export const TierManager = () => {
    const [tiers, setTiers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTier, setEditingTier] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isCreating, setIsCreating] = useState(false);
    const [newTier, setNewTier] = useState({
        name: '',
        display_name: '',
        description: '',
        hourly_limit: -1,
        daily_limit: -1,
        weekly_limit: -1,
        monthly_limit: -1,
        rate_limit_rpm: -1,
        rate_limit_tpm: -1,
        price_monthly: 0,
    });

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('tiers')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) {
            console.error('Error fetching tiers:', error);
        } else {
            setTiers(data || []);
        }
        setIsLoading(false);
    };

    const startEditingTier = (tier: any) => {
        setEditingTier(tier.id);
        setEditForm({ ...tier });
    };

    const cancelEditing = () => {
        setEditingTier(null);
        setEditForm({});
    };

    const saveTier = async (tierId: string) => {
        const { error } = await supabase
            .from('tiers')
            .update({
                display_name: editForm.display_name,
                description: editForm.description,
                hourly_limit: editForm.hourly_limit,
                daily_limit: editForm.daily_limit,
                weekly_limit: editForm.weekly_limit,
                monthly_limit: editForm.monthly_limit,
                rate_limit_rpm: editForm.rate_limit_rpm,
                rate_limit_tpm: editForm.rate_limit_tpm,
                price_monthly: editForm.price_monthly,
                is_active: editForm.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', tierId);

        if (error) {
            console.error('Error updating tier:', error);
            alert('Failed to update tier');
        } else {
            setEditingTier(null);
            setEditForm({});
            fetchTiers();
        }
    };

    const createTier = async () => {
        if (!newTier.name || !newTier.display_name) {
            alert('Name and display name are required');
            return;
        }

        const { error } = await supabase
            .from('tiers')
            .insert([newTier]);

        if (error) {
            console.error('Error creating tier:', error);
            alert('Failed to create tier');
        } else {
            setIsCreating(false);
            setNewTier({
                name: '',
                display_name: '',
                description: '',
                hourly_limit: -1,
                daily_limit: -1,
                weekly_limit: -1,
                monthly_limit: -1,
                rate_limit_rpm: -1,
                rate_limit_tpm: -1,
                price_monthly: 0,
            });
            fetchTiers();
        }
    };

    const deleteTier = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tier? Users assigned to this tier will have no limits.')) return;

        const { error } = await supabase
            .from('tiers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tier:', error);
            alert('Failed to delete tier');
        } else {
            fetchTiers();
        }
    };

    const formatLimit = (limit: number) => {
        if (limit === -1) return 'Unlimited';
        if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`;
        if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
        return limit.toString();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Tier Management</h1>
                <p className="text-dark-400">Configure usage tiers and limits for your users.</p>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-900/50">
                    <h3 className="font-bold text-sm uppercase text-dark-500 tracking-wider">Available Tiers</h3>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus size={14} />
                        New Tier
                    </button>
                </div>

                {isCreating && (
                    <div className="p-6 bg-accent-cyan/5 border-b border-dark-800">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Create New Tier</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Name (lowercase, no spaces)</label>
                                <input
                                    type="text"
                                    value={newTier.name}
                                    onChange={(e) => setNewTier({ ...newTier, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                    placeholder="e.g., custom_tier"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={newTier.display_name}
                                    onChange={(e) => setNewTier({ ...newTier, display_name: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                    placeholder="e.g., Custom Tier"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Description</label>
                                <input
                                    type="text"
                                    value={newTier.description}
                                    onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                    placeholder="Brief description of the tier"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Hourly Limit (tokens)</label>
                                <input
                                    type="number"
                                    value={newTier.hourly_limit}
                                    onChange={(e) => setNewTier({ ...newTier, hourly_limit: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Daily Limit (tokens)</label>
                                <input
                                    type="number"
                                    value={newTier.daily_limit}
                                    onChange={(e) => setNewTier({ ...newTier, daily_limit: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Weekly Limit (tokens)</label>
                                <input
                                    type="number"
                                    value={newTier.weekly_limit}
                                    onChange={(e) => setNewTier({ ...newTier, weekly_limit: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Monthly Limit (tokens)</label>
                                <input
                                    type="number"
                                    value={newTier.monthly_limit}
                                    onChange={(e) => setNewTier({ ...newTier, monthly_limit: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Rate Limit (RPM)</label>
                                <input
                                    type="number"
                                    value={newTier.rate_limit_rpm}
                                    onChange={(e) => setNewTier({ ...newTier, rate_limit_rpm: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Rate Limit (TPM)</label>
                                <input
                                    type="number"
                                    value={newTier.rate_limit_tpm}
                                    onChange={(e) => setNewTier({ ...newTier, rate_limit_tpm: parseInt(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Price ($/month)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newTier.price_monthly}
                                    onChange={(e) => setNewTier({ ...newTier, price_monthly: parseFloat(e.target.value) })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={createTier}
                                className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 text-sm font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                            >
                                <Save size={16} />
                                Create Tier
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="p-12 text-center text-dark-500">
                        <Loader2 className="mx-auto mb-4 animate-spin opacity-20" size={48} />
                        <p className="text-sm font-medium">Loading tiers...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-800">
                        {tiers.map((tier) => (
                            <div key={tier.id} className="p-6 group hover:bg-dark-800/30 transition-colors">
                                {editingTier === tier.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.display_name}
                                                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Price ($/month)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.price_monthly}
                                                    onChange={(e) => setEditForm({ ...editForm, price_monthly: parseFloat(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Description</label>
                                                <input
                                                    type="text"
                                                    value={editForm.description || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Hourly Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.hourly_limit}
                                                    onChange={(e) => setEditForm({ ...editForm, hourly_limit: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Daily Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.daily_limit}
                                                    onChange={(e) => setEditForm({ ...editForm, daily_limit: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Weekly Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.weekly_limit}
                                                    onChange={(e) => setEditForm({ ...editForm, weekly_limit: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">Monthly Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.monthly_limit}
                                                    onChange={(e) => setEditForm({ ...editForm, monthly_limit: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">RPM Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.rate_limit_rpm}
                                                    onChange={(e) => setEditForm({ ...editForm, rate_limit_rpm: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-dark-500 mb-2 tracking-wider">TPM Limit</label>
                                                <input
                                                    type="number"
                                                    value={editForm.rate_limit_tpm}
                                                    onChange={(e) => setEditForm({ ...editForm, rate_limit_tpm: parseInt(e.target.value) })}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveTier(tier.id)}
                                                className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-dark-950 text-sm font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                                            >
                                                <Save size={16} />
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-xl font-bold text-white">{tier.display_name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-dark-400 font-mono">{tier.name}</span>
                                                {tier.price_monthly > 0 && (
                                                    <span className="text-sm font-bold text-accent-cyan flex items-center gap-1">
                                                        <DollarSign size={14} />
                                                        {tier.price_monthly}/mo
                                                    </span>
                                                )}
                                            </div>
                                            {tier.description && (
                                                <p className="text-sm text-dark-400 mb-3">{tier.description}</p>
                                            )}
                                            <div className="grid grid-cols-6 gap-4 mt-3">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Hourly</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.hourly_limit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Daily</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.daily_limit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Weekly</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.weekly_limit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">Monthly</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.monthly_limit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">RPM</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.rate_limit_rpm)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-dark-500 mb-1">TPM</p>
                                                    <p className="text-sm font-mono text-white">{formatLimit(tier.rate_limit_tpm)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditingTier(tier)}
                                                className="text-dark-500 hover:text-accent-cyan p-2 rounded-lg hover:bg-accent-cyan/10 transition-all"
                                                title="Edit tier"
                                            >
                                                <Settings size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteTier(tier.id)}
                                                className="text-dark-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                                                title="Delete tier"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
