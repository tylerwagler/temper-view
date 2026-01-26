import React from 'react';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface PCIeCardProps {
    pcie: {
        tx_throughput_kbs: number;
        rx_throughput_kbs: number;
        gen: number;
        width: number;
    };
    gpuLabel: string;
}

export const PCIeCard: React.FC<PCIeCardProps> = ({ pcie, gpuLabel }) => {
    const smoothedTx = useSmoothedValue(pcie.tx_throughput_kbs, 500);
    const smoothedRx = useSmoothedValue(pcie.rx_throughput_kbs, 500);

    // Calculate theoretical max throughput in MB/s based on Gen/Width
    const getMaxThroughputMB = (gen: number, width: number) => {
        // approximate MB/s per lane
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

    // Calculate actual utilization percentages
    const txUtil = (txMB / maxSpeedMB) * 100;
    const rxUtil = (rxMB / maxSpeedMB) * 100;

    const formatSpeed = (kbs: number) => {
        if (kbs > 1024) {
            return `${(kbs / 1024).toFixed(1)} MB/s`;
        }
        return `${Math.round(kbs)} KB/s`;
    };

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">PCIe Link</h3>
                <span className="text-sm text-dark-600">{gpuLabel}</span>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-dark-700 rounded text-xs font-mono text-white">
                        Gen {pcie.gen}
                    </div>
                    <div className="px-3 py-1 bg-dark-700 rounded text-xs font-mono text-white">
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
                        <span>TX</span>
                        <div className="text-right">
                            <span className="text-white font-mono mr-2">{formatSpeed(smoothedTx)}</span>
                            <span className="text-xs text-dark-500">({txUtil.toFixed(2)}%)</span>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-cyan transition-all duration-300"
                            style={{ width: `${Math.max(1, txUtil)}%` }} // Minimum 1% visual width
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-1 text-dark-400">
                        <span>RX</span>
                        <div className="text-right">
                            <span className="text-white font-mono mr-2">{formatSpeed(smoothedRx)}</span>
                            <span className="text-xs text-dark-500">({rxUtil.toFixed(2)}%)</span>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-dark-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${Math.max(1, rxUtil)}%` }} // Minimum 1% visual width
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
