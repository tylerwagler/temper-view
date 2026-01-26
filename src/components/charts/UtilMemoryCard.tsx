import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface UtilMemoryCardProps {
    gpuLoadPercent: number;
    memoryLoadPercent: number; // Controller Load
    memoryUsedMB: number;
    memoryTotalMB: number;
    gpuLabel: string;
}

const MemoryGaugeWithVRAM: React.FC<{
    loadPercent: number;
    usedMB: number;
    totalMB: number;
}> = ({ loadPercent, usedMB, totalMB }) => {
    const vramPercent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;
    const smoothedVram = useSmoothedValue(vramPercent, 500);

    return (
        <div className="flex flex-col items-center h-full">
            <GaugeChart
                value={loadPercent}
                max={100}
                label="" // No label (value is centered)
                unit="%"
                title="Memory Load" // Controller Load
                color="#ef4444" // Keep red/orange theme?
                minimal
            />

            {/* VRAM Capacity Bar (Below Gauge) */}
            <div className="mt-4 w-full max-w-[200px]">
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-dark-600">VRAM: {Math.round(smoothedVram)}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${smoothedVram >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${smoothedVram}%` }}
                    />
                </div>
                <div className="text-right text-[10px] text-dark-500 font-mono">
                    {usedMB} / {totalMB} MB
                </div>
            </div>
        </div>
    );
};

export const UtilMemoryCard: React.FC<UtilMemoryCardProps> = ({
    gpuLoadPercent,
    memoryLoadPercent,
    memoryUsedMB,
    memoryTotalMB,
    gpuLabel
}) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Utilization & Memory</h3>
                <span className="text-sm text-dark-600">{gpuLabel}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
                <div className="border-b md:border-b-0 md:border-r border-dark-700 pb-6 md:pb-0 md:pr-4 flex justify-center text-center">
                    <GaugeChart
                        value={gpuLoadPercent}
                        max={100}
                        label=""
                        unit="%"
                        title="Compute"
                        color="#22c55e"
                        minimal
                    />
                </div>
                <div className="pt-6 md:pt-0 md:pl-4 flex justify-center text-center">
                    <MemoryGaugeWithVRAM
                        loadPercent={memoryLoadPercent}
                        usedMB={memoryUsedMB}
                        totalMB={memoryTotalMB}
                    />
                </div>
            </div>
        </div>
    );
};
