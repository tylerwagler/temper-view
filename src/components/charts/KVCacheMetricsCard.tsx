import React from 'react';
import type { SlotMetrics } from '../../types/gpu';

interface KVCacheMetricsCardProps {
    slots: SlotMetrics[];
    modelName?: string;
}

export const KVCacheMetricsCard: React.FC<KVCacheMetricsCardProps> = ({ slots, modelName }) => {
    // Calculate aggregate metrics
    const totalCapacity = slots.reduce((sum, s) => sum + (s.n_ctx || 0), 0);
    const totalUsed = slots.reduce((sum, s) => sum + (s.kv_cache?.cells_used || 0), 0);
    const overallUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

    // Active slots (non-idle or with cache)
    const activeSlots = slots.filter(s => s.state !== 'idle' || (s.kv_cache && s.kv_cache.cells_used > 0));
    const idleSlots = slots.filter(s => s.state === 'idle' && (!s.kv_cache || s.kv_cache.cells_used === 0));

    // Color scheme for slots
    const slotColors = [
        { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
        { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
        { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
        { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
        { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
        { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500' },
    ];

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">KV Cache Metrics</h3>
                    {modelName && <div className="text-xs text-dark-500 mt-0.5">{modelName}</div>}
                </div>
                <div className="text-right">
                    <div className="text-xs text-dark-500">Overall Utilization</div>
                    <div className="text-2xl font-bold text-white font-mono">{overallUtilization.toFixed(2)}%</div>
                </div>
            </div>

            {/* Overall Stats Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-dark-500 mb-2">
                    <span>Total Cache Used</span>
                    <span className="font-mono">{totalUsed.toLocaleString()} / {totalCapacity.toLocaleString()} cells</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden flex">
                    {slots.map((slot, idx) => {
                        const slotCells = slot.kv_cache?.cells_used || 0;
                        const slotPercent = totalCapacity > 0 ? (slotCells / totalCapacity) * 100 : 0;
                        if (slotPercent <= 0) return null;

                        const colors = slotColors[idx % slotColors.length];
                        return (
                            <div
                                key={slot.id}
                                className={`h-3 transition-all duration-300 ${colors.bg} ${slot.state !== 'idle' ? 'animate-pulse' : ''}`}
                                style={{ width: `${slotPercent}%` }}
                                title={`Slot ${slot.id}: ${slotCells.toLocaleString()} cells`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-xs text-dark-600 mt-1">
                    <span>{activeSlots.length} active</span>
                    <span>{idleSlots.length} idle</span>
                </div>
            </div>

            {/* Detailed Slot Metrics */}
            <div className="space-y-3">
                {slots.map((slot, idx) => {
                    const colors = slotColors[idx % slotColors.length];
                    const isActive = slot.state !== 'idle';
                    const kv = slot.kv_cache;
                    const perf = slot.performance;

                    // Skip empty idle slots
                    if (!isActive && (!kv || kv.cells_used === 0)) {
                        return null;
                    }

                    const utilization = kv ? kv.utilization * 100 : 0;
                    const cacheEfficiency = kv ? kv.cache_efficiency * 100 : 0;

                    return (
                        <div
                            key={slot.id}
                            className={`border-l-3 ${colors.border} pl-4 pr-3 py-3 bg-dark-750 rounded-r transition-all ${isActive ? 'bg-opacity-50' : 'bg-opacity-20'
                                }`}
                        >
                            {/* Slot Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
                                    <span className="text-sm font-semibold text-white">Slot {slot.id}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${isActive
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-dark-700 text-dark-500'
                                        }`}>
                                        {slot.state}
                                    </span>
                                </div>
                                <div className="text-xs text-dark-400">
                                    Context: <span className="font-mono">{slot.n_ctx.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* KV Cache Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Position Range */}
                                <div className="bg-dark-800 rounded p-2">
                                    <div className="text-xs text-dark-500 mb-1">Position Range</div>
                                    <div className="font-mono text-sm text-white">
                                        {kv && kv.pos_min >= 0 ? (
                                            <>{kv.pos_min.toLocaleString()} - {kv.pos_max.toLocaleString()}</>
                                        ) : (
                                            <span className="text-dark-500">Empty</span>
                                        )}
                                    </div>
                                </div>

                                {/* Cells Used */}
                                <div className="bg-dark-800 rounded p-2">
                                    <div className="text-xs text-dark-500 mb-1">Cells Used</div>
                                    <div className="font-mono text-sm text-white">
                                        {kv ? kv.cells_used.toLocaleString() : 0}
                                        <span className="text-xs text-dark-500 ml-1">
                                            ({utilization.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>

                                {/* Cache Efficiency */}
                                <div className="bg-dark-800 rounded p-2">
                                    <div className="text-xs text-dark-500 mb-1">Cache Efficiency</div>
                                    <div className={`font-mono text-sm font-semibold ${cacheEfficiency > 50 ? 'text-emerald-400' : cacheEfficiency > 0 ? 'text-amber-400' : 'text-dark-500'
                                        }`}>
                                        {cacheEfficiency.toFixed(0)}%
                                    </div>
                                </div>

                                {/* Tokens Processed */}
                                <div className="bg-dark-800 rounded p-2">
                                    <div className="text-xs text-dark-500 mb-1">Tokens</div>
                                    <div className="font-mono text-sm text-white">
                                        <span className="text-dark-500">P:</span> {slot.prompt_n}
                                        <span className="text-dark-600 mx-1">/</span>
                                        <span className="text-dark-500">G:</span> {slot.predicted_n}
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            {perf && (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-700">
                                    <div className="text-center">
                                        <div className="text-xs text-dark-500">Prompt</div>
                                        <div className="font-mono text-sm text-cyan-400">
                                            {perf.prompt_tokens_per_sec.toFixed(0)} <span className="text-xs text-dark-500">T/s</span>
                                        </div>
                                    </div>
                                    <div className="text-center border-l border-dark-700">
                                        <div className="text-xs text-dark-500">Generation</div>
                                        <div className="font-mono text-sm text-cyan-400">
                                            {perf.generation_tokens_per_sec.toFixed(1)} <span className="text-xs text-dark-500">T/s</span>
                                        </div>
                                    </div>
                                    {perf.speculative_acceptance_rate !== undefined && (
                                        <div className="text-center border-l border-dark-700">
                                            <div className="text-xs text-dark-500">Spec Accept</div>
                                            <div className="font-mono text-sm text-purple-400">
                                                {(perf.speculative_acceptance_rate * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show idle slots count if any */}
            {idleSlots.length > 0 && (
                <div className="mt-4 text-center text-xs text-dark-500">
                    {idleSlots.length} idle slot{idleSlots.length !== 1 ? 's' : ''} (empty)
                </div>
            )}
        </div>
    );
};
