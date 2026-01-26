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
                {/* P0 Zone Indicator (Top 20%) */}


                {/* Progress Bar */}
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

interface ClocksCardProps {
    clocks: {
        graphics: number;
        memory: number;
        video: number;
        sm: number;
        max_graphics: number;
        max_memory: number;
    };
    pState: { id: number; description: string };
    gpuLabel: string;
}

export const ClocksCard: React.FC<ClocksCardProps> = ({ clocks, pState, gpuLabel }) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">Clocks</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-dark-700 text-accent-cyan border border-dark-600 cursor-help" title={`Performance State: ${pState.description}`}>
                        P{pState.id}
                    </span>
                </div>
                <span className="text-sm text-dark-600">{gpuLabel}</span>
            </div>

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
                    label="SM"
                    freq={clocks.sm}
                    color="bg-green-500"
                // SM clock often tracks Graphics, so maybe no explicit max
                />
                <ClockBar
                    label="Video"
                    freq={clocks.video}
                    color="bg-orange-500"
                />
            </div>
        </div>
    );
};
