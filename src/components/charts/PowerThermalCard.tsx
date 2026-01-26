import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface PowerThermalCardProps {
    temperature: number;
    fanSpeedPercent: number;
    targetFanPercent: number;
    powerUsageW: number;
    powerLimitW: number;
    hardwareMaxW: number;
    gpuLabel: string;
}

// Internal component for Thermal Gauge (Simplified from ThermalCard)
const ThermalGauge: React.FC<{
    temperature: number;
    fanSpeedPercent: number;
    targetFanPercent: number;
}> = ({ temperature, fanSpeedPercent, targetFanPercent }) => {
    const smoothedTemp = useSmoothedValue(temperature, 500);
    const smoothedFan = useSmoothedValue(fanSpeedPercent, 500);
    const maxTemp = 100;

    // SVG Config
    const width = 200;
    const height = 180;
    const strokeWidth = 14;
    const radius = 70;
    const cx = width / 2;
    const cy = 90;
    const startAngle = 135;
    const endAngle = 405;
    const sweepAngle = endAngle - startAngle;

    const angleToCoord = (angleDeg: number, r: number = radius) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    };

    const createArc = (startDeg: number, endDeg: number, r: number = radius) => {
        const start = angleToCoord(startDeg, r);
        const end = angleToCoord(endDeg, r);
        const sweep = endDeg - startDeg;
        const largeArc = sweep > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    const tempPercentage = Math.min(100, Math.max(0, (smoothedTemp / maxTemp) * 100));
    const valueAngle = startAngle + (tempPercentage / 100) * sweepAngle;

    // Colors
    const warningTemp = 70;
    const dangerTemp = 85;
    const warningAngle = startAngle + (warningTemp / maxTemp) * sweepAngle;
    const dangerAngle = startAngle + (dangerTemp / maxTemp) * sweepAngle;

    let color = '#22c55e';
    if (smoothedTemp >= dangerTemp) color = '#ef4444';
    else if (smoothedTemp >= warningTemp) color = '#f97316';

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-dark-400 mb-2">Thermals</h4>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Background */}
                <path d={createArc(startAngle, endAngle)} fill="none" stroke="#334155" strokeWidth={strokeWidth} strokeLinecap="round" />

                {/* Warning Zone (Solid Color Cap Simulation) */}
                <path d={createArc(warningAngle, dangerAngle)} fill="none" stroke="#69522a" strokeWidth={strokeWidth} strokeLinecap="butt" />
                <path d={`M ${angleToCoord(warningAngle).x} ${angleToCoord(warningAngle).y} l 0 0`} fill="none" stroke="#69522a" strokeWidth={strokeWidth} strokeLinecap="round" />

                {/* Danger Zone */}
                <path d={createArc(dangerAngle, endAngle)} fill="none" stroke="#67323e" strokeWidth={strokeWidth} strokeLinecap="butt" />
                <path d={`M ${angleToCoord(endAngle).x} ${angleToCoord(endAngle).y} l 0 0`} fill="none" stroke="#67323e" strokeWidth={strokeWidth} strokeLinecap="round" />

                {/* Value Arc */}
                <path d={createArc(startAngle, valueAngle)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

                {/* Labels */}
                <text x={35} y={height - 10} fill="#94a3b8" fontSize="12" textAnchor="middle">0</text>
                <text x={width - 35} y={height - 10} fill="#94a3b8" fontSize="12" textAnchor="middle">100</text>

                {/* Centered Value Text */}
                <text
                    x={cx}
                    y={cy}
                    fill={color}
                    fontSize="32"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {Math.round(smoothedTemp)}
                    <tspan fontSize="16" fill="#94a3b8" dx="2" dy="-10">°C</tspan>
                </text>
            </svg>

            {/* Fan Speed */}
            <div className="mt-4 w-full max-w-[200px]">
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-dark-600">Fan: {Math.round(smoothedFan)}%</span>
                    <span className="text-dark-600">Target: {targetFanPercent}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5 mb-1">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${smoothedFan >= 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${smoothedFan}%` }} />
                </div>
                <div className="text-right text-[10px] text-dark-500">
                    ~{Math.round((smoothedFan / 100) * 3000)} RPM
                </div>
            </div>
        </div>
    );
};

export const PowerThermalCard: React.FC<PowerThermalCardProps> = ({
    temperature, fanSpeedPercent, targetFanPercent,
    powerUsageW, powerLimitW, hardwareMaxW, gpuLabel
}) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Power & Thermals</h3>
                <span className="text-sm text-dark-600">{gpuLabel}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
                <div className="border-b md:border-b-0 md:border-r border-dark-700 pb-6 md:pb-0 md:pr-4 flex justify-center">
                    <ThermalGauge
                        temperature={temperature}
                        fanSpeedPercent={fanSpeedPercent}
                        targetFanPercent={targetFanPercent}
                    />
                </div>
                <div className="pt-6 md:pt-0 md:pl-4 flex justify-center text-center">
                    <GaugeChart
                        value={powerUsageW}
                        max={hardwareMaxW}
                        label="" // No subtitle needed since title covers it
                        unit="W"
                        title="Power Consumption"
                        thresholds={{ warning: 70, danger: 90 }}
                        powerLimitW={powerLimitW}
                        hardwareMaxW={hardwareMaxW}
                        minimal={true}
                    />
                </div>
            </div>
        </div>
    );
};
