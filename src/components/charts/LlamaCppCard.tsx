import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import type { AiServiceMetrics } from '../../types/gpu';
import { ProgressBar } from '../ProgressBar';
import { getAvailableModels, switchModel, stopContainer } from '../../api/modelApi';
import { supabase } from '../../lib/supabase';
import { Play, Square, Loader2 } from 'lucide-react';

interface LlamaCppCardProps {
    stats: AiServiceMetrics | null;
    onHide?: () => void;
    isAdmin: boolean;
    session?: any;
}

export const LlamaCppCard: React.FC<LlamaCppCardProps> = ({ stats, onHide, isAdmin, session }) => {
    const queryClient = useQueryClient();
    const [selectedModel, setSelectedModel] = useState<string>('GLM 4.7 Flash');
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    const { data: availableModels } = useQuery({
        queryKey: ['available-models'],
        queryFn: getAvailableModels,
        enabled: isAdmin
    });

    const modelName = stats?.model || null;
    const isLoading = stats?.status === 'loading';
    const loadProgress = stats?.load_progress || 0;
    const isOffline = !stats || stats?.status === 'offline';

    // Set selectedModel to the currently loaded model
    React.useEffect(() => {
        if (modelName && availableModels) {
            const loadedModel = availableModels.find(m => modelName.includes(m.name));
            if (loadedModel && selectedModel !== loadedModel.name) {
                console.log('[LlamaCppCard] Setting selectedModel to loaded model:', loadedModel.name);
                setSelectedModel(loadedModel.name);
            }
        }
    }, [modelName, availableModels]);

    // Clear isStarting when model starts loading or becomes ready
    React.useEffect(() => {
        if (isStarting && (stats?.status === 'loading' || stats?.status === 'ready')) {
            console.log('[LlamaCppCard] Model is loading/ready, clearing isStarting');
            setIsStarting(false);
        }
    }, [isStarting, stats?.status]);

    // Failsafe: clear isStarting after 90 seconds (model loading can take 60+ seconds)
    React.useEffect(() => {
        if (isStarting) {
            const timeout = setTimeout(() => {
                console.log('[LlamaCppCard] Clearing isStarting due to timeout (90s)');
                setIsStarting(false);
            }, 90000);
            return () => clearTimeout(timeout);
        }
    }, [isStarting]);

    // Start mutation (switch model + start container)
    const startMutation = useMutation({
        mutationFn: async () => {
            setIsStarting(true);
            let token = session?.access_token;
            if (!token) {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            }
            if (!token) throw new Error('Not authenticated');

            // Switch to selected model first
            await switchModel(selectedModel, token);
            // Container will auto-restart via model switch
        },
        onSuccess: () => {
            // Invalidate and refetch immediately
            queryClient.invalidateQueries({ queryKey: ['gpu-stats'] });
            queryClient.refetchQueries({ queryKey: ['gpu-stats'] });
            setError(null);
            // Keep isStarting true - will be cleared when we see loading status or timeout
        },
        onError: (err: any) => {
            setError(err.message);
            setIsStarting(false);
        }
    });

    // Stop mutation
    const stopMutation = useMutation({
        mutationFn: async () => {
            let token = session?.access_token;
            if (!token) {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            }
            if (!token) throw new Error('Not authenticated');

            await stopContainer(token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gpu-stats'] });
            setError(null);
        },
        onError: (err: any) => setError(err.message)
    });

    // Smoothing for TPS
    const smoothedTPS = useSmoothedValue(stats?.predicted_tokens_seconds || 0, 100);

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[300px] max-w-[300px] relative group overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex flex-col mb-2 pr-6 flex-none border-b border-dark-700 pb-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">AI</h3>
                    <div className="inline-flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                            stats?.status === 'error' ? 'bg-red-500' :
                            stats?.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                            stats?.status === 'ready' ? 'bg-green-500' :
                            'bg-dark-600'
                        }`}></span>
                        <span className={`text-xs ${
                            stats?.status === 'error' ? 'text-red-400' :
                            stats?.status === 'loading' ? 'text-yellow-400' :
                            stats?.status === 'ready' ? 'text-green-400' :
                            'text-dark-500'
                        }`}>
                            {stats?.status ? stats.status.charAt(0).toUpperCase() + stats.status.slice(1) : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Model Controls (admin only) */}
                {isAdmin && (
                    <div className="space-y-2">
                        <div className="flex gap-1.5">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={startMutation.isPending || stopMutation.isPending || isLoading}
                                className="flex-1 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                            >
                                {availableModels?.map(model => (
                                    <option key={model.name} value={model.name}>
                                        {model.alias}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => startMutation.mutate()}
                                disabled={startMutation.isPending || stopMutation.isPending || isLoading || !isOffline}
                                className="p-1 bg-dark-700 hover:bg-accent-cyan/20 border border-dark-600 hover:border-accent-cyan text-accent-cyan rounded transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-dark-700 disabled:hover:border-dark-600"
                                title="Load model"
                            >
                                <Play className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Stop the AI server? This will unload the model.')) {
                                        stopMutation.mutate();
                                    }
                                }}
                                disabled={startMutation.isPending || stopMutation.isPending || isLoading || isOffline}
                                className="p-1 bg-dark-700 hover:bg-red-500/20 border border-dark-600 hover:border-red-500 text-red-400 rounded transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-dark-700 disabled:hover:border-dark-600"
                                title="Unload model"
                            >
                                <Square className="w-3 h-3" />
                            </button>
                        </div>

                        {error && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Model Name (if loaded) */}
                {modelName && !isLoading && (
                    <p className="text-xs text-dark-400 mt-2 truncate" title={modelName}>
                        {modelName}
                    </p>
                )}

                {/* Loading Progress Bar (simple version) */}
                {isLoading && (
                    <div className="mt-3">
                        <ProgressBar
                            progress={loadProgress}
                            label={loadProgress > 0 ? `${(loadProgress * 100).toFixed(0)}% Complete` : 'Initializing...'}
                        />
                    </div>
                )}
            </div>

            {onHide && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide();
                    }}
                    className="absolute top-1.5 right-1.5 text-dark-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Hide AI"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {/* Loading overlay for start/stop operations only (not model loading) */}
            {(startMutation.isPending || stopMutation.isPending || isStarting) && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 px-4">
                    <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
                    <div className="text-center w-full">
                        <p className="text-sm font-medium text-white mb-2">
                            {stopMutation.isPending ? 'Stopping Container...' : 'Starting Container...'}
                        </p>
                        <p className="text-xs text-dark-400">
                            {stopMutation.isPending ? 'Unloading model from memory' : 'Preparing container...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Only show stats if model is loaded and not performing operation */}
            {stats && stats.status !== 'offline' && !startMutation.isPending && !stopMutation.isPending && !isLoading && !isStarting && (
                <div className="flex flex-col gap-3">
                    {/* Performance Stats */}
                    <div className="px-2 border-b border-dark-700 pb-3">
                        <div className="grid grid-cols-2 gap-2">
                            {/* Avg Gen */}
                            <div className="flex flex-col">
                                <span className="text-xs text-dark-500 mb-0.5">Avg Gen</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-accent-cyan font-mono">
                                        {smoothedTPS.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-dark-400 font-mono">T/s</span>
                                </div>
                            </div>

                            {/* Prompt Eval */}
                            <div className="flex flex-col border-l border-dark-700 pl-2">
                                <span className="text-xs text-dark-500 mb-0.5">Prompt Eval</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-white font-mono">
                                        {stats.prompt_tokens_seconds ? stats.prompt_tokens_seconds.toFixed(0) : '-'}
                                    </span>
                                    <span className="text-xs text-dark-400 font-mono">T/s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KV Cache Utilization - Stacked Segment Bar */}
                    <div className="px-2">
                        {(() => {
                            // Calculate total tokens from slots using new kv_cache metrics
                            const slots = stats.slots || [];

                            // Use tokens_cached which is calculated from pos_max
                            const totalCached = slots.reduce((sum, s) => {
                                return sum + (s.tokens_cached || 0);
                            }, 0);

                            // With unified cache, all slots share a single context pool
                            // Use the first slot's n_ctx (they all report the same value)
                            const kvTotal = slots.length > 0
                                ? (slots[0]?.n_ctx || 0)
                                : (stats.kv_cache_tokens || stats.n_ctx || 0);

                            const usagePercent = kvTotal > 0 ? (totalCached / kvTotal) * 100 : 0;

                            // Slot colors for segments
                            const slotColors = [
                                'bg-cyan-500',
                                'bg-purple-500',
                                'bg-emerald-500',
                                'bg-amber-500',
                                'bg-rose-500',
                                'bg-indigo-500'
                            ];

                            return (
                                <>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-dark-500">KV Cache <span className="text-dark-600">({usagePercent.toFixed(0)}%)</span></span>
                                        <span className="text-xs text-dark-400 font-mono">
                                            {totalCached.toLocaleString()} / {kvTotal.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Stacked bar - Shows contribution to total system cache */}
                                    <div className="w-full bg-dark-700 rounded-full h-2 mb-2 overflow-hidden flex">
                                        {slots.map((slot, idx) => {
                                            const slotCached = slot.tokens_cached || 0;
                                            const slotPercent = kvTotal > 0
                                                ? (slotCached / kvTotal) * 100
                                                : 0;
                                            if (slotPercent <= 0) return null;

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`h-2 transition-all duration-300 ${slotColors[idx % slotColors.length]} ${slot.state !== 'idle' ? 'animate-pulse' : ''
                                                        }`}
                                                    style={{ width: `${slotPercent}%` }}
                                                    title={`Slot ${slot.id}: ${slotCached.toLocaleString()} tokens (pos ${slot.kv_cache?.pos_min ?? 'N/A'}-${slot.kv_cache?.pos_max ?? 'N/A'})`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Detailed Slot Usage Legend */}
                                    <div className="flex flex-col gap-1">
                                        {slots.map((slot, idx) => {
                                            const slotCached = slot.tokens_cached || 0;

                                            // Use new kv_cache.utilization if available, otherwise calculate
                                            const slotUsagePercent = slot.kv_cache?.utilization
                                                ? slot.kv_cache.utilization * 100
                                                : (slot.n_ctx > 0 ? (slotCached / slot.n_ctx * 100) : 0);

                                            // Use new performance metrics if available
                                            const slotTPS = slot.performance?.generation_tokens_per_sec
                                                || (slot.predicted_ms > 0 ? (slot.predicted_n / (slot.predicted_ms / 1000)) : 0);

                                            const isActive = slot.state !== 'idle';

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`flex flex-col gap-1 border-l-2 pl-2 py-1 transition-colors ${isActive ? 'border-cyan-500 bg-cyan-500/5 pulse-subtle' : 'border-dark-600'
                                                        }`}
                                                    title={`Slot ${slot.id}: ${slotCached.toLocaleString()} cells cached. ${slotTPS.toFixed(1)} T/s. Pos: ${slot.kv_cache?.pos_min ?? 'N/A'}-${slot.kv_cache?.pos_max ?? 'N/A'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`inline-block w-2 h-2 rounded-full ${slotColors[idx % slotColors.length]}`} />
                                                                <span className="text-dark-400 font-semibold text-xs">Slot {slot.id}</span>
                                                            </div>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ml-0.5 mt-0.5 inline-block ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-dark-700 text-dark-500'
                                                                }`}>
                                                                {slot.state.toLowerCase()}
                                                            </span>
                                                        </div>
                                                        <div className="font-mono text-dark-300 text-[10px]">
                                                            {slotCached.toLocaleString()} <span className="text-dark-500">/</span> {slot.n_ctx.toLocaleString()} <span className="text-dark-600 text-[9px]">({slotUsagePercent.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-mono pl-3 text-dark-500">
                                                        <div>
                                                            <span className="text-accent-cyan">{slotTPS.toFixed(1)}</span> T/s
                                                            {slot.performance?.prompt_tokens_per_sec && (
                                                                <span className="text-dark-600 ml-1">
                                                                    (P: {slot.performance.prompt_tokens_per_sec.toFixed(0)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};
