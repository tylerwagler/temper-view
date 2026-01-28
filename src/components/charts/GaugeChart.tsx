import React from 'react';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';

interface GaugeChartProps {
    value: number;
    min?: number;
    max: number;
    label: string;
    unit: string;
    title: string;
    subtitle?: string;
    thresholds?: { warning: number; danger: number };
    powerLimitW?: number;  // Current TDP limit in watts
    hardwareMaxW?: number; // Hardware maximum TDP in watts
    showYellowZone?: boolean;
    color?: string;        // Override color
    showNeedle?: boolean;  // Deprecated/Ignored
    minimal?: boolean;     // Render without card wrapper
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
    value,
    min = 0,
    max,
    label,
    unit,
    title,
    subtitle,
    thresholds = { warning: 70, danger: 90 },
    showYellowZone = false,
    color: overrideColor,
    minimal = false,
}) => {
    // Smooth the value over 500ms
    const smoothedValue = useSmoothedValue(value, 500);

    // Calculate percentage based on smoothed value
    const percentage = Math.min(100, Math.max(0, ((smoothedValue - min) / (max - min)) * 100));

    // Determine color based on thresholds
    const getColor = () => {
        if (overrideColor) return overrideColor;
        const pct = percentage;
        if (pct >= thresholds.danger) return '#ef4444'; // red
        if (pct >= thresholds.warning) return '#f97316'; // orange
        return '#22c55e'; // green
    };

    const color = getColor();

    // SVG settings
    const width = 200;
    const height = 160;
    const strokeWidth = 14;
    const radius = 70;
    const cx = width / 2;
    const cy = 80;

    // Arc goes from 135° to 405° (270° sweep)
    const startAngle = 135;
    const endAngle = 405;
    const sweepAngle = endAngle - startAngle;

    // Convert angle to SVG coordinates
    const angleToCoord = (angleDeg: number, r: number = radius) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    };

    // Create arc path using SVG arc command
    const createArc = (startDeg: number, endDeg: number, r: number = radius) => {
        const start = angleToCoord(startDeg, r);
        const end = angleToCoord(endDeg, r);
        const sweep = endDeg - startDeg;
        const largeArc = sweep > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    // Create filled sector path for zones with custom caps
    const createSectorPath = (startDeg: number, endDeg: number, innerR: number, outerR: number) => {
        const startOuter = angleToCoord(startDeg, outerR);
        const endOuter = angleToCoord(endDeg, outerR);
        const startInner = angleToCoord(startDeg, innerR);
        const endInner = angleToCoord(endDeg, innerR);

        const sweep = endDeg - startDeg;
        const largeArc = sweep > 180 ? 1 : 0;

        // Path:
        // 1. Move to Start Outer
        // 2. Arc to End Outer
        // 3. Line to End Inner (Butt cap) OR Arc to End Inner (Round cap) - effectively we control this by drawing the shape.
        // Actually for the "end cap" to be round, we need an arc from EndOuter to EndInner with radius = (outerR - innerR)/2.
        // For "start cap" to be round, we need arc from StartInner to StartOuter.

        // In our specific case:
        // Yellow: Start Butt, End Butt.
        // Red: Start Butt, End Round.

        return {
            buttButt: `
                M ${startOuter.x} ${startOuter.y}
                A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
                L ${endInner.x} ${endInner.y}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}
                Z
            `,
            buttRound: `
                M ${startOuter.x} ${startOuter.y}
                A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
                A ${(outerR - innerR) / 2} ${(outerR - innerR) / 2} 0 1 1 ${endInner.x} ${endInner.y}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}
                Z
            `
        };
    };

    // Calculate angles
    const valueAngle = startAngle + (percentage / 100) * sweepAngle;
    const warningAngle = startAngle + (thresholds.warning / 100) * sweepAngle;
    const dangerAngle = startAngle + (thresholds.danger / 100) * sweepAngle;

    // For filled paths
    const outerR = radius + strokeWidth / 2;
    const innerR = radius - strokeWidth / 2;

    const content = (
        <div className="flex flex-col items-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Background arc */}
                <path
                    d={createArc(startAngle, endAngle)}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Yellow warning zone (Butt-Butt) */}
                {showYellowZone && (
                    <path
                        d={createSectorPath(warningAngle, dangerAngle, innerR, outerR).buttButt}
                        fill="#f59e0b"
                        fillOpacity={0.3}
                    />
                )}

                {/* Red danger zone (Butt-Round) */}
                {showYellowZone && (
                    <path
                        d={createSectorPath(dangerAngle, endAngle, innerR, outerR).buttRound}
                        fill="#ef4444"
                        fillOpacity={0.3}
                    />
                )}

                {/* Filled arc (progress) */}
                {percentage > 0 && (
                    <path
                        d={createArc(startAngle, valueAngle)}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                )}

                {/* Min label */}
                <text
                    x={35}
                    y={height - 10}
                    fill="#94a3b8"
                    fontSize="12"
                    textAnchor="middle"
                >
                    {min}
                </text>

                {/* Max label */}
                <text
                    x={width - 35}
                    y={height - 10}
                    fill="#94a3b8"
                    fontSize="12"
                    textAnchor="middle"
                >
                    {max}
                </text>

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
                    {Math.round(smoothedValue)}
                    <tspan fontSize="16" fill="#94a3b8" dx="2" dy="-10">{unit}</tspan>
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
                    {title}
                </text>
                {/* Subtitle - centered below title */}
                {subtitle && (
                    <text
                        x={cx}
                        y={height - 14}
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                    >
                        {subtitle}
                    </text>
                )}
            </svg>
        </div>
    );

    if (minimal) {
        return content;
    }

    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <span className="text-sm text-dark-600">{label}</span>
            </div>
            {content}
        </div>
    );
};
