import React from 'react';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import type { AiServiceMetrics } from '../../types/gpu';

interface LlamaCppCardProps {
    stats: AiServiceMetrics | null;
    onHide?: () => void;
}

export const LlamaCppCard: React.FC<LlamaCppCardProps> = ({ stats, onHide }) => {
    // Extract model name from model or model_path
    const rawModel = stats?.model || (stats?.model_path ? stats.model_path.split('/').pop() : null);
    // If model is a path (contains /), take the last part
    const modelName = rawModel ? rawModel.split('/').pop() : null;

    if (!stats || !modelName) {
        return (
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[220px] max-w-[220px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">AI</h3>
                </div>
                <div className="text-center text-dark-500 text-sm py-8">
                    No model active
                </div>
            </div>
        );
    }

    // Context size and usage from unified stats
    // Prioritize n_ctx if available, otherwise n_tokens_max
    const ctxSize = stats.n_ctx || stats.n_tokens_max;

    // Calculate context used
    // If we have n_ctx and ratio, we can calculate used tokens more accurately
    // Otherwise fallback to existing logic
    const contextUsed = ctxSize && stats.kv_cache_usage_ratio
        ? Math.round(ctxSize * stats.kv_cache_usage_ratio)
        : (stats.kv_cache_tokens || 0);

    const contextPercent = (stats.kv_cache_usage_ratio || 0) * 100;

    // Smoothing for TPS and usage
    const smoothedTPS = useSmoothedValue(stats.predicted_tokens_seconds || 0, 100);
    const smoothedContextUsed = useSmoothedValue(contextUsed, 500);
    const smoothedContextPercent = useSmoothedValue(contextPercent, 500);

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[220px] max-w-[220px] relative group overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 pr-6 flex-none">
                <h3 className="text-lg font-semibold text-white">AI</h3>
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

            {/* Content */}
            <div className="flex flex-col gap-4">
                {/* Model Info */}
                <div className="px-2 border-b border-dark-700 pb-3">
                    <div className="text-[10px] text-dark-500 mb-1">Model</div>
                    <div className="text-sm font-mono text-white truncate mb-1" title={modelName}>
                        {modelName}
                    </div>
                    <div className="text-[10px] text-dark-500 mb-2">
                        Context Window: <span className="text-dark-300">{ctxSize ? ctxSize.toLocaleString() : 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="inline-flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${stats.status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <span className={`text-[10px] ${stats.status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
                            </span>
                        </div>
                        {stats.requests_processing > 0 && (
                            <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                                Processing
                            </span>
                        )}
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="px-2 border-b border-dark-700 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                        {/* Avg Gen */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-dark-500 mb-0.5">Avg Gen</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-accent-cyan font-mono">
                                    {smoothedTPS.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-dark-400 font-mono">T/s</span>
                            </div>
                        </div>

                        {/* Prompt Eval */}
                        <div className="flex flex-col border-l border-dark-700 pl-2">
                            <span className="text-[10px] text-dark-500 mb-0.5">Prompt Eval</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white font-mono">
                                    {stats.prompt_tokens_seconds ? stats.prompt_tokens_seconds.toFixed(0) : '-'}
                                </span>
                                <span className="text-[10px] text-dark-400 font-mono">T/s</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Concurrency & Queue */}
                <div className="px-2 border-b border-dark-700 pb-3 flex justify-between items-center text-xs">
                    <div className="flex gap-2">
                        <span className="text-dark-500">Slots:</span>
                        <span className="font-mono text-dark-300">
                            {/* Use max of slots_used and requests_processing to avoid 0/1 when processing */}
                            {Math.max(stats.slots_used, stats.requests_processing)} <span className="text-dark-600">/</span> {stats.slots_total}
                        </span>
                    </div>
                    {stats.requests_deferred > 0 && (
                        <div className="flex gap-2 text-yellow-500 animate-pulse font-semibold">
                            <span>Queue:</span>
                            <span className="font-mono">{stats.requests_deferred}</span>
                        </div>
                    )}
                </div>

                {/* KV Cache / Context Usage */}
                <div className="px-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-dark-500">Context Usage</span>
                        <span className="text-[10px] text-dark-400 font-mono">
                            {Math.round(smoothedContextUsed).toLocaleString()} / {ctxSize ? ctxSize.toLocaleString() : 'unknown'}
                        </span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-1.5 mb-1">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${smoothedContextPercent > 90 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${Math.min(smoothedContextPercent, 100)}%` }}
                        />
                    </div>
                    <div className="text-right text-[10px] text-dark-500">
                        {smoothedContextPercent.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};
