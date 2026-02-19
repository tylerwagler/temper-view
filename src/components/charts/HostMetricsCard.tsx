import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import { ProgressBar } from '../ProgressBar';
import type { HostMetrics, AiServiceMetrics } from '../../types/gpu';
import type { ModelInfo } from '../../api/modelApi';

interface HostMetricsCardProps {
    host: string;
    metrics: HostMetrics;
    onHide?: () => void;
    aiService?: AiServiceMetrics | null;
    availableModels?: ModelInfo[];
}

const friendlyModelName = (raw: string, availableModels?: ModelInfo[]): string => {
    if (!raw) return '';
    if (availableModels) {
        const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
        const normalized = normalize(raw);
        const match = availableModels.find(m => normalized.includes(normalize(m.name)));
        if (match) return match.alias;
    }
    const basename = raw.split('/').pop() || raw;
    return basename.replace(/\.gguf$/i, '').replace(/[-_](Q\d_\w+|f16|f32|fp16)$/i, '');
};

export const HostMetricsCard: React.FC<HostMetricsCardProps> = ({ host, metrics, onHide, aiService, availableModels }) => {
    const hostname = metrics?.hostname || host.replace(/^https?:\/\//, '').split(':')[0];

    const smoothedCpu = useSmoothedValue(metrics?.cpu_load_percent || 0, 500);
    const memTotal = metrics?.memory_total_mb || 1;
    const memAvail = metrics?.memory_available_mb || 0;
    const memUsed = memTotal - memAvail;
    const memPercent = (memUsed / memTotal) * 100;
    const smoothedMem = useSmoothedValue(memPercent, 500);
    const fanRpm = metrics?.fan_rpm || 0;
    const smoothedFanRpm = useSmoothedValue(fanRpm, 500);
    const cpuTemp = metrics?.cpu_temp_celsius || 0;
    const smoothedCpuTemp = useSmoothedValue(cpuTemp, 500);

    // AI metrics
    const isVllm = (aiService as any)?.backend === 'vllm';
    const smoothedGenTPS = useSmoothedValue(aiService?.predicted_tokens_seconds || 0, 100);
    const isLoading = aiService?.status === 'loading';
    const loadProgress = aiService?.load_progress || 0;
    const displayModelName = aiService
        ? friendlyModelName(aiService.model || aiService.model_path || '', availableModels)
        : '';

    // Compact KV cache calculation (backend-aware)
    const slots = aiService?.slots || [];
    let kvTotalCached: number, kvTotal: number, kvPercent: number;
    if (isVllm) {
        const poolTokens = (aiService as any)?.kv_cache_pool_tokens || 0;
        const usageRatio = aiService?.kv_cache_usage_ratio || 0;
        kvTotal = poolTokens;
        kvTotalCached = Math.round(usageRatio * poolTokens);
        kvPercent = usageRatio * 100;
    } else {
        kvTotalCached = slots.reduce((sum, s) => sum + (s.tokens_cached || 0), 0);
        kvTotal = slots.length > 0 ? (slots[0]?.n_ctx || 0) : (aiService?.kv_cache_tokens || aiService?.n_ctx || 0);
        kvPercent = kvTotal > 0 ? (kvTotalCached / kvTotal) * 100 : 0;
    }

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[280px] max-w-[280px] relative group">
            <div className="flex justify-between items-center mb-2 pr-6">
                <h3 className="text-lg font-semibold text-white truncate" title={hostname}>Host: {hostname}</h3>
            </div>

            {onHide && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide();
                    }}
                    className="absolute top-1.5 right-1.5 text-dark-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Hide Host Metrics"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {/* Single Column Layout */}
            <div className="flex flex-col gap-3">
                {/* CPU Load */}
                <div className="flex flex-col items-center justify-center p-1 border-b border-dark-700 pb-2">
                    <GaugeChart
                        value={smoothedCpu}
                        max={100}
                        label=""
                        unit="%"
                        title="CPU Load"
                        subtitle=""
                        color="#22c55e"
                        minimal
                    />
                </div>

                {/* Memory */}
                <div className="px-2 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-dark-500">Memory Load</span>
                        <span className="text-[10px] text-dark-500">{Math.round(memUsed)} / {Math.round(memTotal)} MB</span>
                    </div>
                    <div className="h-2 w-full bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${smoothedMem >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${smoothedMem}%` }}
                        />
                    </div>
                </div>

                {/* CPU Temperature — only shown when host reports it */}
                {smoothedCpuTemp > 0 && (
                    <div className="px-2 flex flex-col justify-center border-t border-dark-700 pt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-dark-500">CPU Temp</span>
                            <span className={`text-[10px] font-mono ${smoothedCpuTemp >= 85 ? 'text-red-400' : smoothedCpuTemp >= 70 ? 'text-yellow-400' : 'text-dark-400'}`}>
                                {Math.round(smoothedCpuTemp)}°C
                            </span>
                        </div>
                        <div className="h-2 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${smoothedCpuTemp >= 85 ? 'bg-red-500' : smoothedCpuTemp >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (smoothedCpuTemp / 100) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* System Fan — only shown when host reports fan RPM */}
                {smoothedFanRpm > 0 && (
                    <div className="px-2 flex flex-col justify-center border-t border-dark-700 pt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-dark-500">System Fan</span>
                            <span className="text-[10px] font-mono text-dark-400">{Math.round(smoothedFanRpm)} RPM</span>
                        </div>
                        <div className="h-2 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${smoothedFanRpm >= 4000 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (smoothedFanRpm / 5000) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* AI Service Status — compact inline section */}
                {aiService && (
                    <div className="px-2 flex flex-col gap-2 border-t border-dark-700 pt-2">
                        {/* Status + Model Name */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                aiService.status === 'error' ? 'bg-red-500' :
                                aiService.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                                aiService.status === 'ready' ? 'bg-green-500' :
                                'bg-dark-600'
                            }`} />
                            {displayModelName && !isLoading ? (
                                <span className="text-sm font-semibold text-accent-cyan truncate" title={aiService.model || ''}>
                                    {displayModelName}
                                </span>
                            ) : (
                                <span className={`text-xs ${
                                    aiService.status === 'error' ? 'text-red-400' :
                                    aiService.status === 'loading' ? 'text-yellow-400' :
                                    'text-dark-500'
                                }`}>
                                    {aiService.status ? aiService.status.charAt(0).toUpperCase() + aiService.status.slice(1) : 'Offline'}
                                </span>
                            )}
                        </div>

                        {/* Loading Progress */}
                        {isLoading && (
                            <ProgressBar
                                progress={loadProgress}
                                label={loadProgress > 0 ? `${(loadProgress * 100).toFixed(0)}%` : 'Loading...'}
                            />
                        )}

                        {/* Throughput — only when ready */}
                        {aiService.status === 'ready' && !isLoading && (
                            <div className="flex items-center gap-3 text-xs font-mono">
                                <span className="text-dark-500">Gen</span>
                                <span className="text-accent-cyan font-bold">{smoothedGenTPS.toFixed(1)}</span>
                                <span className="text-dark-600">T/s</span>
                                <span className="text-dark-700">|</span>
                                <span className="text-dark-500">Reqs</span>
                                <span className="text-white font-bold">{aiService.requests_processing || 0}</span>
                                {(aiService.requests_deferred || 0) > 0 && (
                                    <>
                                        <span className="text-dark-700">/</span>
                                        <span className="text-yellow-400 font-bold">{aiService.requests_deferred}</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Compact KV Cache Bar — only when ready with data */}
                        {aiService.status === 'ready' && !isLoading && kvTotal > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[10px] text-dark-500">KV {kvPercent.toFixed(0)}%</span>
                                    <span className="text-[10px] text-dark-600 font-mono">
                                        {kvTotalCached.toLocaleString()} / {kvTotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${kvPercent >= 90 ? 'bg-red-500' : kvPercent >= 70 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                                        style={{ width: `${kvPercent}%` }}
                                    />
                                </div>
                                {/* Per-slot breakdown for multi-slot llama */}
                                {!isVllm && slots.length > 1 && (
                                    <div className="flex gap-3 mt-0.5">
                                        {slots.map((s) => (
                                            <span key={s.id} className="text-[9px] font-mono text-dark-600">
                                                S{s.id}:{' '}
                                                <span className={s.state === 'processing' ? 'text-accent-cyan' : 'text-dark-500'}>
                                                    {(s.tokens_cached || 0).toLocaleString()}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
