import React from 'react';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface ClockProps {
    label: string;
    freq: number;
    maxFreq?: number;
    color: string;
}

const ClockBar: React.FC<ClockProps> = ({ label, freq, maxFreq, color }) => {
    const smoothedFreq = useSmoothedValue(freq, 500);
    const percent = maxFreq ? Math.min(100, (smoothedFreq / maxFreq) * 100) : 0;

    return (
        <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-400">{label}</span>
                <span className="font-mono text-white">
                    {Math.round(smoothedFreq)}
                    <span className="text-dark-600 text-xs ml-1">MHz</span>
                </span>
            </div>
            <div className="relative h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                <div
                    className={`relative h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: maxFreq ? `${percent}%` : '50%' }}
                />
            </div>
            {maxFreq && (
                <div className="text-right text-[10px] text-dark-600 mt-0.5">
                    Max: {maxFreq} MHz
                </div>
            )}
        </div>
    );
};

interface CombinedClocksCardProps {
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
    pcie: {
        tx_throughput_kbs: number;
        rx_throughput_kbs: number;
        gen: number;
        width: number;
    };
    gpuLabel: string;
    onHide?: () => void;
}

export const CombinedClocksCard: React.FC<CombinedClocksCardProps> = ({ clocks, pcie }) => {
    const smoothedTx = useSmoothedValue(pcie.tx_throughput_kbs, 500);
    const smoothedRx = useSmoothedValue(pcie.rx_throughput_kbs, 500);

    const getMaxThroughputMB = (gen: number, width: number) => {
        const speedPerLane: Record<number, number> = {
            1: 250,
            2: 500,
            3: 985,
            4: 1969,
            5: 3938
        };
        const laneSpeed = speedPerLane[gen] || 250;
        return laneSpeed * width;
    };

    const maxSpeedMB = getMaxThroughputMB(pcie.gen, pcie.width);
    const txMB = smoothedTx / 1024;
    const rxMB = smoothedRx / 1024;
    const txUtil = (txMB / maxSpeedMB) * 100;
    const rxUtil = (rxMB / maxSpeedMB) * 100;

    const formatSpeed = (kbs: number) => {
        if (kbs > 1024) {
            return `${(kbs / 1024).toFixed(1)} MB/s`;
        }
        return `${Math.round(kbs)} KB/s`;
    };

    // Logarithmic scale helper to make low activity visible
    // 100 KB/s -> ~10%
    // 1 MB/s -> ~20%
    // 10 MB/s -> ~35%
    // 100 MB/s -> ~50%
    // 1 GB/s -> ~65%
    // 10 GB/s -> ~80%
    // 32 GB/s -> 100%
    const calcLogPercent = (currentKbs: number, maxKbs: number) => {
        if (currentKbs <= 1) return 0;

        // Use Math.log10 for a natural feel
        // We want 10KB to be visible, so let's shift scale
        const minLog = Math.log10(10); // 10 KB/s baseline
        const maxLog = Math.log10(maxKbs); // ~32,000,000 KB/s
        const curLog = Math.log10(Math.max(10, currentKbs));

        const percent = ((curLog - minLog) / (maxLog - minLog)) * 100;
        return Math.min(100, Math.max(0, percent));
    };

    const maxSpeedKbs = maxSpeedMB * 1024;
    const txLogUtil = calcLogPercent(smoothedTx, maxSpeedKbs);
    const rxLogUtil = calcLogPercent(smoothedRx, maxSpeedKbs);

    return (
        <div>
            {/* Clocks Section */}
            <div className="mb-3 pb-3 border-b border-dark-700">
                <div className="grid grid-cols-1 gap-1">
                    <ClockBar
                        label="Graphics"
                        freq={clocks.graphics}
                        maxFreq={clocks.max_graphics}
                        color="bg-purple-500"
                    />
                    <ClockBar
                        label="Memory"
                        freq={clocks.memory}
                        maxFreq={clocks.max_memory}
                        color="bg-blue-500"
                    />
                    <ClockBar
                        label="Video"
                        freq={clocks.video}
                        maxFreq={clocks.max_video}
                        color="bg-pink-500"
                    />
                    <ClockBar
                        label="Streaming Multiprocessor"
                        freq={clocks.sm}
                        maxFreq={clocks.max_sm}
                        color="bg-orange-500"
                    />
                </div>
            </div>

            {/* PCIe Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-md font-semibold text-white">PCIe Link</h4>
                        <div className="px-2 py-0.5 bg-dark-700 rounded text-xs font-mono text-white">
                            Gen {pcie.gen}
                        </div>
                        <div className="px-2 py-0.5 bg-dark-700 rounded text-xs font-mono text-white">
                            x{pcie.width}
                        </div>
                    </div>
                    <div className="text-xs text-dark-400">
                        Max: {(maxSpeedMB / 1024).toFixed(1)} GB/s
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1 text-dark-400">
                            <span>TX (Transmit)</span>
                            <div className="text-right">
                                <span className="text-white font-mono mr-2">{formatSpeed(smoothedTx)}</span>
                                <span className="text-xs text-dark-500" title="Linear Utilization">({txUtil.toFixed(2)}%)</span>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-cyan transition-all duration-300"
                                style={{ width: `${Math.max(2, txLogUtil)}%` }} // Min 2% visibility if active
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1 text-dark-400">
                            <span>RX (Receive)</span>
                            <div className="text-right">
                                <span className="text-white font-mono mr-2">{formatSpeed(smoothedRx)}</span>
                                <span className="text-xs text-dark-500" title="Linear Utilization">({rxUtil.toFixed(2)}%)</span>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${Math.max(2, rxLogUtil)}%` }} // Min 2% visibility if active
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
