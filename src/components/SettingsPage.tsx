import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

interface SettingsPageProps {
    onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const [hosts, setHosts] = useState<string[]>([]);
    const [newHost, setNewHost] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const savedHosts = localStorage.getItem('temper_remote_hosts');
        if (savedHosts) {
            try {
                setHosts(JSON.parse(savedHosts));
            } catch (e) {
                // Migrate legacy single host if exists
                const singleHost = localStorage.getItem('temper_remote_host');
                if (singleHost) {
                    setHosts([singleHost]);
                    localStorage.setItem('temper_remote_hosts', JSON.stringify([singleHost]));
                    localStorage.removeItem('temper_remote_host');
                }
            }
        } else {
            // Fallback migration check
            const singleHost = localStorage.getItem('temper_remote_host');
            if (singleHost) {
                setHosts([singleHost]);
                localStorage.setItem('temper_remote_hosts', JSON.stringify([singleHost]));
                localStorage.removeItem('temper_remote_host');
            }
        }
    }, []);

    const saveHosts = (updatedHosts: string[]) => {
        setHosts(updatedHosts);
        localStorage.setItem('temper_remote_hosts', JSON.stringify(updatedHosts));
    };

    const handleAddHost = async () => {
        if (!newHost) return;

        let hostUrl = newHost.trim();
        if (!/^https?:\/\//i.test(hostUrl)) {
            hostUrl = `http://${hostUrl}`;
        }

        // Remove trailing slash
        const cleanHost = hostUrl.replace(/\/$/, '');

        if (hosts.includes(cleanHost)) {
            setMessage({ text: 'Host already added', type: 'error' });
            return;
        }

        setIsTesting(true);
        setMessage({ text: 'Testing connection...', type: 'success' }); // Info really

        try {
            const response = await fetch(`${cleanHost}/metrics`);
            if (response.ok) {
                const updated = [...hosts, cleanHost];
                saveHosts(updated);
                setNewHost('');
                setMessage({ text: 'Host added successfully', type: 'success' });
            } else {
                setMessage({ text: `Failed to connect: ${response.status}`, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Connection failed. Unreachable.', type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };

    const removeHost = (host: string) => {
        const updated = hosts.filter(h => h !== host);
        saveHosts(updated);
    };

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-accent-cyan" />
                        Settings
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Connection Settings */}
                    <section className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-accent-green" />
                            Remote Hosts
                        </h2>

                        <div className="space-y-6">
                            {/* Add New Host */}
                            <div>
                                <label className="block text-sm text-dark-400 mb-1">Add New Host</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newHost}
                                        onChange={(e) => setNewHost(e.target.value)}
                                        placeholder="http://10.20.10.5:3001"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddHost()}
                                        className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-cyan"
                                    />
                                    <button
                                        onClick={handleAddHost}
                                        disabled={isTesting || !newHost}
                                        className="bg-accent-cyan text-black font-semibold px-6 py-2 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Add
                                    </button>
                                </div>
                                {message && (
                                    <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                        {message.text}
                                    </p>
                                )}
                            </div>

                            {/* Host List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-dark-300 uppercase tracking-wider">Configured Hosts</h3>
                                {hosts.length === 0 ? (
                                    <div className="text-dark-500 text-sm italic py-2">No hosts configured. Dashboard will be empty.</div>
                                ) : (
                                    hosts.map(host => (
                                        <div key={host} className="flex items-center justify-between bg-dark-900 p-3 rounded-lg border border-dark-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="font-mono text-sm">{host}</span>
                                            </div>
                                            <button
                                                onClick={() => removeHost(host)}
                                                className="text-dark-500 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded hover:bg-dark-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Global Display Settings (Placeholder for future extension) */}
                    <section className="bg-dark-800 rounded-xl p-6 border border-dark-700 opacity-50">
                        <h2 className="text-lg font-semibold mb-4 text-dark-400">
                            Global Display Options (Coming Soon)
                        </h2>
                        <p className="text-dark-500 text-sm">
                            Configure default card visibility for all GPUs.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
