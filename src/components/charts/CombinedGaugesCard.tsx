import React from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface CombinedGaugesCardProps {
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
    gpuLabel: string;
    onHide?: () => void;
}

// Reuse MemoryGaugeWithVRAM Logic
const MemoryGaugeWithVRAM: React.FC<{
    loadPercent: number;
    usedMB: number;
    totalMB: number;
}> = ({ loadPercent, usedMB, totalMB }) => {
    const vramPercent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;
    const smoothedVram = useSmoothedValue(vramPercent, 500);

    let color = '#22c55e'; // Green
    if (loadPercent >= 90) color = '#ef4444'; // Red
    else if (loadPercent >= 70) color = '#f97316'; // Orange

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

// Reuse ThermalGauge Logic
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
    const height = 160;
    const strokeWidth = 14;
    const radius = 70;
    const cx = width / 2;
    const cy = 80;
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

    const warningTemp = 70;
    const dangerTemp = 85;
    const warningAngle = startAngle + (warningTemp / maxTemp) * sweepAngle;
    const dangerAngle = startAngle + (dangerTemp / maxTemp) * sweepAngle;

    let color = '#22c55e';
    if (smoothedTemp >= dangerTemp) color = '#ef4444';
    else if (smoothedTemp >= warningTemp) color = '#f97316';

    return (
        <div className="flex flex-col items-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Background */}
                <path d={createArc(startAngle, endAngle)} fill="none" stroke="#334155" strokeWidth={strokeWidth} strokeLinecap="round" />

                {/* Warning Zone */}
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
                <text x={cx} y={cy} fill={color} fontSize="32" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                    {Math.round(smoothedTemp)}
                    <tspan fontSize="16" fill="#94a3b8" dx="2" dy="-10">°C</tspan>
                </text>

                {/* Title - centered at bottom between arc endpoints */}
                <text
                    x={cx}
                    y={height - 28}
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                >
                    Temperature
                </text>
            </svg>

            {/* Fan Speed */}
            <div className="mt-1 w-full max-w-[200px]">
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

export const CombinedGaugesCard: React.FC<CombinedGaugesCardProps> = (props) => {
    // Smooth the power limit to prevent jumpy gauge zones
    const smoothedPowerLimitW = useSmoothedValue(props.powerLimitW, 2000);

    return (
        <div>
            {/* 2x2 Grid with Borders */}
            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Row 1, Col 1: Compute (Top Left) */}
                <div className="flex justify-center items-center border-b border-r border-dark-700 p-1">
                    <GaugeChart
                        value={props.gpuLoadPercent}
                        max={100}
                        label=""
                        unit="%"
                        title="Compute"
                        color="#22c55e"
                        minimal
                    />
                </div>

                {/* Row 1, Col 2: Power (Top Right) */}
                <div className="flex justify-center items-center border-b border-dark-700 p-1 md:border-l-0">
                    {(() => {
                        // Calculate dynamic thresholds
                        // Red Zone: PLimit to PMax (100%)
                        // Yellow Zone: PLimit - 0.5 * (PMax - PLimit) to PLimit
                        // These need to be percentages of max (which is hardwareMaxW)
                        let thresholds = { warning: 70, danger: 90 }; // fallback
                        let showZones = false;

                        if (smoothedPowerLimitW && props.hardwareMaxW && props.hardwareMaxW > 0) {
                            const pLimit = smoothedPowerLimitW;
                            const pMax = props.hardwareMaxW;

                            // Only show zones if limiting is active (with small buffer for float inaccuracies)
                            if (pLimit < pMax - 1) {
                                const startRed = pLimit;
                                const startYellow = pLimit - 0.5 * (pMax - pLimit);

                                thresholds = {
                                    warning: Math.max(0, (startYellow / pMax) * 100),
                                    danger: Math.min(100, (startRed / pMax) * 100)
                                };
                                showZones = true;
                            }
                        }

                        return (
                            <GaugeChart
                                value={props.powerUsageW}
                                max={props.hardwareMaxW}
                                label=""
                                unit="W"
                                title="Power"
                                thresholds={thresholds}
                                hardwareMaxW={props.hardwareMaxW}
                                showYellowZone={showZones}
                                minimal={true}
                            />
                        );
                    })()}
                </div>

                {/* Row 2, Col 1: Memory (Bottom Left) */}
                <div className="flex justify-center items-center border-r border-dark-700 p-1">
                    <MemoryGaugeWithVRAM
                        loadPercent={props.memoryLoadPercent}
                        usedMB={props.memoryUsedMB}
                        totalMB={props.memoryTotalMB}
                    />
                </div>

                {/* Row 2, Col 2: Thermals (Bottom Right) */}
                <div className="flex justify-center items-center p-1 md:border-l-0">
                    <ThermalGauge
                        temperature={props.temperature}
                        fanSpeedPercent={props.fanSpeedPercent}
                        targetFanPercent={props.targetFanPercent}
                    />
                </div>
            </div>
        </div>
    );
};
