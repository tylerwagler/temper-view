import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface GPUMetricsCardProps {
    // Performance Metrics
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

    // System Info
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

const MemoryGaugeWithVRAM: React.FC<{
    loadPercent: number;
    usedMB: number;
    totalMB: number;
}> = ({ loadPercent, usedMB, totalMB }) => {
    const vramPercent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;
    const smoothedVram = useSmoothedValue(vramPercent, 500);

    let color = '#22c55e';
    if (loadPercent >= 90) color = '#ef4444';
    else if (loadPercent >= 70) color = '#f97316';

    return (
        <div className="flex flex-col items-center h-full">
            <GaugeChart
                value={loadPercent}
                max={100}
                label=""
                unit="%"
                title="Memory Load"
                color={color}
                minimal
            />
            <div className="mt-1 w-full max-w-[200px]">
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-dark-600">VRAM Utilization: {Math.round(smoothedVram)}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${smoothedVram >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${smoothedVram}%` }}
                    />
                </div>
                <div className="text-right text-[10px] text-dark-500">
                    {usedMB} / {totalMB} MB
                </div>
            </div>
        </div>
    );
};

const ClockBar: React.FC<{
    label: string;
    freq: number;
    maxFreq?: number;
    color: string;
}> = ({ label, freq, maxFreq, color }) => {
    const smoothedFreq = useSmoothedValue(freq, 500);
    const percent = maxFreq ? Math.min(100, (smoothedFreq / maxFreq) * 100) : 0;

    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-dark-400">{label}</span>
                <span className="font-mono text-white text-xs">
                    {Math.round(smoothedFreq)}
                    <span className="text-dark-600 text-[10px] ml-1">MHz</span>
                </span>
            </div>
            <div className="relative h-1 w-full bg-dark-700 rounded-full overflow-hidden">
                <div
                    className={`relative h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: maxFreq ? `${percent}%` : '50%' }}
                />
            </div>
        </div>
    );
};

export const GPUMetricsCard: React.FC<GPUMetricsCardProps> = ({
    gpuLoadPercent,
    memoryLoadPercent,
    memoryUsedMB,
    memoryTotalMB,
    temperature,
    fanSpeedPercent,
    targetFanPercent,
    powerUsageW,
    powerLimitW,
    clocks,
    pState,
    pcie,
    gpuLabel,
    onHide
}) => {
    const smoothedGpuLoad = useSmoothedValue(gpuLoadPercent, 500);
    const smoothedTemp = useSmoothedValue(temperature, 500);
    const smoothedFanSpeed = useSmoothedValue(fanSpeedPercent, 500);
    const smoothedPower = useSmoothedValue(powerUsageW, 500);

    let tempColor = '#22c55e';
    if (smoothedTemp >= 85) tempColor = '#ef4444';
    else if (smoothedTemp >= 75) tempColor = '#f97316';

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[800px] relative group">
            <div className="flex justify-between items-center mb-4 pr-6">
                <h3 className="text-lg font-semibold text-white">GPU Metrics</h3>
                <span className="text-sm text-dark-600">{gpuLabel}</span>
            </div>

            {onHide && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide();
                    }}
                    className="absolute top-1.5 right-1.5 text-dark-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Hide GPU Metrics"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-6">
                {/* Left: Performance Gauges - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* GPU Load */}
                    <div className="flex flex-col items-center justify-center p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <GaugeChart
                            value={smoothedGpuLoad}
                            max={100}
                            label=""
                            unit="%"
                            title="GPU Load"
                            color="#22c55e"
                            minimal
                        />
                    </div>

                    {/* Memory with VRAM Bar */}
                    <div className="p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <MemoryGaugeWithVRAM
                            loadPercent={memoryLoadPercent}
                            usedMB={memoryUsedMB}
                            totalMB={memoryTotalMB}
                        />
                    </div>

                    {/* Temperature */}
                    <div className="flex flex-col items-center justify-center p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <GaugeChart
                            value={smoothedTemp}
                            max={100}
                            label=""
                            unit="°C"
                            title="Temperature"
                            color={tempColor}
                            minimal
                        />
                    </div>

                    {/* Fan Speed */}
                    <div className="flex flex-col items-center justify-center p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <GaugeChart
                            value={smoothedFanSpeed}
                            max={100}
                            label=""
                            unit="%"
                            title="Fan Speed"
                            color="#22c55e"
                            minimal
                        />
                        <div className="text-[10px] text-dark-500 mt-1">
                            Target: {targetFanPercent}%
                        </div>
                    </div>
                </div>

                {/* Right: System Info (Clocks & PCIe) */}
                <div className="space-y-3">
                    {/* Power Usage */}
                    <div className="flex items-center justify-between p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <span className="text-xs text-dark-400 uppercase tracking-wider">Power Usage</span>
                        <span className="font-mono text-white text-sm">
                            {smoothedPower}W
                            <span className="text-[10px] text-dark-500 ml-2">
                                / {powerLimitW}W limit
                            </span>
                        </span>
                    </div>

                    {/* Performance State */}
                    <div className="flex items-center justify-between p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                        <span className="text-xs text-dark-400 uppercase tracking-wider">Performance State</span>
                        <span className="font-mono text-white text-sm">
                            P{pState.id}
                            <span className="text-[10px] bg-dark-700 px-1.5 py-0.5 rounded text-dark-300 ml-2">
                                {pState.description}
                            </span>
                        </span>
                    </div>

                    {/* Clocks */}
                    <div className="p-3 bg-dark-900/50 rounded-lg border border-dark-700">
                        <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Clock Speeds</div>
                        <ClockBar label="Graphics" freq={clocks.graphics} maxFreq={clocks.max_graphics} color="bg-blue-500" />
                        <ClockBar label="Memory" freq={clocks.memory} maxFreq={clocks.max_memory} color="bg-green-500" />
                        <ClockBar label="Video" freq={clocks.video} maxFreq={clocks.max_video} color="bg-yellow-500" />
                        <ClockBar label="SM" freq={clocks.sm} maxFreq={clocks.max_sm} color="bg-purple-500" />
                    </div>

                    {/* PCIe */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                            <div className="text-[10px] text-dark-500 mb-1">PCIe Link</div>
                            <div className="font-mono text-white text-sm">
                                Gen{pcie.gen} x{pcie.width}
                            </div>
                        </div>
                        <div className="p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                            <div className="text-[10px] text-dark-500 mb-1">TX / RX</div>
                            <div className="font-mono text-white text-xs">
                                {(pcie.tx_throughput_kbs / 1024).toFixed(1)} / {(pcie.rx_throughput_kbs / 1024).toFixed(1)} MB/s
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
