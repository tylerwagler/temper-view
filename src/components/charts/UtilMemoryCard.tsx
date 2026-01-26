import React from 'react';
import { GaugeChart } from './GaugeChart';

interface UtilMemoryCardProps {
    gpuLoadPercent: number;
    memoryLoadPercent: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    gpuLabel: string;
}

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
                        showNeedle
                        minimal
                    />
                </div>
                <div className="pt-6 md:pt-0 md:pl-4 flex justify-center text-center">
                    <GaugeChart
                        value={memoryLoadPercent}
                        max={100}
                        label={`${memoryUsedMB} / ${memoryTotalMB} MB`}
                        unit="%"
                        title="VRAM"
                        color="#ef4444"
                        showNeedle
                        minimal
                    />
                </div>
            </div>
        </div>
    );
};
