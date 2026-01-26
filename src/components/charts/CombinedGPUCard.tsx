import React from 'react';
import { CombinedGaugesCard } from './CombinedGaugesCard';
import { CombinedClocksCard } from './CombinedClocksCard';

interface CombinedGPUCardProps {
    // Performance Metrics props
    gpuLoadPercent: number;
    memoryLoadPercent: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    temperature: number;
    fanSpeedPercent: number;
    targetFanPercent: number;
    powerUsageW: number;
    powerLimitW: number;
    hardwareMaxW: number;

    // System Info props
    clocks: {
        graphics: number;
        memory: number;
        video: number;
        sm: number;
        max_graphics: number;
        max_memory: number;
        max_video: number;
        max_sm: number;
    };
    pState: { id: number; description: string };
    pcie: {
        tx_throughput_kbs: number;
        rx_throughput_kbs: number;
        gen: number;
        width: number;
    };

    gpuLabel: string;
    onHide?: () => void;
}

export const CombinedGPUCard: React.FC<CombinedGPUCardProps> = (props) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full relative group">
            {/* Combined header */}
            <div className="flex justify-between items-center mb-4 pr-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">GPU Metrics</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-dark-700 text-accent-cyan border border-dark-600 cursor-help" title={`Performance State: ${props.pState.description}`}>
                        P{props.pState.id}
                    </span>
                </div>
                <span className="text-sm text-dark-600">{props.gpuLabel}</span>
            </div>

            {/* Single hide button for whole card */}
            {props.onHide && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onHide?.();
                    }}
                    className="absolute top-1.5 right-1.5 text-dark-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Hide GPU Metrics"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {/* Side by side layout with responsive wrapping */}
            <div className="flex flex-wrap gap-6">
                {/* Left: Performance Metrics - remove outer card wrapper, just use content */}
                <div className="flex-none min-w-[450px]">
                    <CombinedGaugesCard
                        gpuLoadPercent={props.gpuLoadPercent}
                        memoryLoadPercent={props.memoryLoadPercent}
                        memoryUsedMB={props.memoryUsedMB}
                        memoryTotalMB={props.memoryTotalMB}
                        temperature={props.temperature}
                        fanSpeedPercent={props.fanSpeedPercent}
                        targetFanPercent={props.targetFanPercent}
                        powerUsageW={props.powerUsageW}
                        powerLimitW={props.powerLimitW}
                        hardwareMaxW={props.hardwareMaxW}
                        gpuLabel="" // Don't show label since we have it in parent
                    // Don't pass onHide - we handle it at parent level
                    />
                </div>

                {/* Right: System Info - remove outer card wrapper, just use content */}
                <div className="flex-1 min-w-[300px] overflow-hidden">
                    <CombinedClocksCard
                        clocks={props.clocks}
                        pcie={props.pcie}
                        gpuLabel="" // Don't show label since we have it in parent
                    // Don't pass onHide - we handle it at parent level
                    />
                </div>
            </div>
        </div>
    );
};
