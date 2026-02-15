import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import type { HostMetrics } from '../../types/gpu';

interface HostMetricsCardProps {
    host: string;
    metrics: HostMetrics;
    onHide?: () => void;
}

export const HostMetricsCard: React.FC<HostMetricsCardProps> = ({ host, metrics, onHide }) => {
    // Use hostname from metrics, fallback to parsing host URL
    const hostname = metrics?.hostname || host.replace(/^https?:\/\//, '').split(':')[0];

    const smoothedCpu = useSmoothedValue(metrics?.cpu_load_percent || 0, 500);
    const memTotal = metrics?.memory_total_mb || 1;
    const memAvail = metrics?.memory_available_mb || 0;
    const memUsed = memTotal - memAvail;
    const memPercent = (memUsed / memTotal) * 100;
    const smoothedMem = useSmoothedValue(memPercent, 500);

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[220px] max-w-[220px] relative group">
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
            </div>
        </div>
    );
};
