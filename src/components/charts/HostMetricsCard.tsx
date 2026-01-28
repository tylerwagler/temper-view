import React, { useState } from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import type { HostMetrics, ChassisMetrics } from '../../types/gpu';

interface HostMetricsCardProps {
    host: string;
    metrics: HostMetrics;
    chassis: ChassisMetrics;
    onHide?: () => void;
}

interface FanModalProps {
    fans: number[];
    targetPercent: number;
    onClose: () => void;
}

const FanModal: React.FC<FanModalProps> = ({ fans, targetPercent, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-dark-800 rounded-xl shadow-2xl border border-dark-700 w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Fan Details</h2>
                    <button
                        onClick={onClose}
                        className="text-dark-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-4 text-sm text-dark-400">
                        Target: <span className="text-white font-mono">{targetPercent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {fans.map((rpm, idx) => {
                            // Replicate fault logic: 0 RPM or >5% deviation
                            const avg = fans.length > 0 ? fans.reduce((a, b) => a + b, 0) / fans.length : 0;
                            const isFaulty = rpm === 0 || (Math.abs(rpm - avg) / avg > 0.05);

                            return (
                                <div key={idx} className={`p-3 bg-dark-900/50 rounded-lg border ${isFaulty ? 'border-red-500/50' : 'border-dark-700'}`}>
                                    <div className="text-xs text-dark-500 mb-1">Fan {idx + 1}</div>
                                    <div className={`text-lg font-mono ${isFaulty ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {rpm} <span className="text-xs text-dark-600">RPM</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HostMetricsCard: React.FC<HostMetricsCardProps> = ({ host, metrics, chassis, onHide }) => {
    const [showFanModal, setShowFanModal] = useState(false);

    // Use hostname from metrics, fallback to parsing host URL
    const hostname = metrics?.hostname || host.replace(/^https?:\/\//, '').split(':')[0];

    const smoothedCpu = useSmoothedValue(metrics?.cpu_load_percent || 0, 500);
    const memTotal = metrics?.memory_total_mb || 1;
    const memAvail = metrics?.memory_available_mb || 0;
    const memUsed = memTotal - memAvail;
    const memPercent = (memUsed / memTotal) * 100;
    const smoothedMem = useSmoothedValue(memPercent, 500);

    // Calculate average fan speed and detect faults
    const fans = chassis?.fans_rpm || [];
    const avgFan = fans.length > 0 ? Math.round(fans.reduce((a, b) => a + b, 0) / fans.length) : 0;
    const isFanFaulty = fans.some(rpm => {
        if (rpm === 0) return true; // Faulted fan
        const diff = Math.abs(rpm - avgFan);
        return (diff / avgFan) > 0.05; // More than 5% out of family
    });

    // Fan Bar Logic (Based on Target Percentage)
    const targetFanPercent = chassis?.target_fan_percent || 0;
    const smoothedTargetPercent = useSmoothedValue(targetFanPercent, 2000);
    const smoothedAvgFanRpm = useSmoothedValue(avgFan, 2000);

    const getFanColor = () => {
        if (isFanFaulty) return 'bg-red-500 animate-pulse';
        if (smoothedTargetPercent >= 90) return 'bg-red-500';
        if (smoothedTargetPercent >= 70) return 'bg-orange-500';
        return 'bg-green-500';
    };

    // Power consumption color (dual 1100W PSUs = 2200W total capacity)
    const TOTAL_PSU_CAPACITY_W = 2200;
    const powerConsumption = chassis?.power_consumption_w || 0;
    const powerUtilization = (powerConsumption / TOTAL_PSU_CAPACITY_W) * 100;

    const getPowerColor = () => {
        if (powerUtilization >= 85) return 'text-red-500';
        if (powerUtilization >= 70) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <>
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[220px] max-w-[220px] relative group">
                <div className="flex justify-between items-center mb-2 pr-6">
                    <h3 className="text-lg font-semibold text-white truncate" title={hostname}>Host: {hostname}</h3>
                </div>

                {onHide && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onHide();
                        }}
                        className="absolute top-1.5 right-1.5 text-dark-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="Hide Host Metrics"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Single Column Layout */}
                <div className="flex flex-col gap-3">
                    {/* CPU Load */}
                    <div className="flex flex-col items-center justify-center p-1 border-b border-dark-700 pb-2">
                        <GaugeChart
                            value={smoothedCpu}
                            max={100}
                            label=""
                            unit="%"
                            title="CPU Load"
                            subtitle=""
                            color="#22c55e"
                            minimal
                        />
                    </div>

                    {/* Power */}
                    <div className="px-2 border-b border-dark-700 pb-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-dark-500">Power</span>
                            <span className={`text-sm font-bold font-mono ${getPowerColor()}`}>{chassis?.power_consumption_w || 0}W</span>
                        </div>

                        {/* PSU Status Boxes */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* PSU 1 */}
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border ${chassis?.psu1_voltage_v > 0 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                <svg className={`w-3 h-3 ${chassis?.psu1_voltage_v > 0 ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-dark-600 leading-none">PSU1</span>
                                    <span className={`text-[9px] font-mono leading-tight ${chassis?.psu1_voltage_v > 0 ? 'text-dark-400' : 'text-red-500'}`}>
                                        {chassis?.psu1_voltage_v > 0 ? `${chassis.psu1_voltage_v.toFixed(0)}V ${chassis.psu1_current_a.toFixed(1)}A` : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {/* PSU 2 */}
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border ${chassis?.psu2_voltage_v > 0 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                <svg className={`w-3 h-3 ${chassis?.psu2_voltage_v > 0 ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-dark-600 leading-none">PSU2</span>
                                    <span className={`text-[9px] font-mono leading-tight ${chassis?.psu2_voltage_v > 0 ? 'text-dark-400' : 'text-red-500'}`}>
                                        {chassis?.psu2_voltage_v > 0 ? `${chassis.psu2_voltage_v.toFixed(0)}V ${chassis.psu2_current_a.toFixed(1)}A` : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memory (No % readout) */}
                    <div className="px-2 flex flex-col justify-center border-b border-dark-700 pb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-dark-500">Memory Load</span>
                            <span className="text-[10px] text-dark-500">{Math.round(memUsed)} / {Math.round(memTotal)} MB</span>
                        </div>
                        <div className="h-2 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${smoothedMem >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${smoothedMem}%` }}
                            />
                        </div>
                    </div>

                    {/* CPU Temps */}
                    {(chassis?.cpu_temps_c || []).length > 0 && (
                        <div className="px-2 border-b border-dark-700 pb-3">
                            <div className="text-[10px] text-dark-500 mb-2 text-center">CPU Temperature</div>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                {(chassis?.cpu_temps_c || []).map((temp, idx) => (
                                    <div key={`cpu-${idx}`} className="flex justify-between items-center">
                                        <span className="text-[9px] text-dark-600">CPU{idx}</span>
                                        <span className={`text-sm font-bold font-mono ${temp > 90 ? 'text-red-500' :
                                            temp > 70 ? 'text-orange-400' :
                                                'text-green-400'
                                            }`}>{temp}°C</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fans (Clickable) */}
                    <div
                        className="px-2 cursor-pointer hover:bg-dark-700/30 transition-colors rounded flex flex-col justify-center"
                        onClick={() => setShowFanModal(true)}
                        title="Click to see all fans"
                    >
                        <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-dark-500">Fans</span>
                            <span className={`font-mono ${isFanFaulty ? 'text-red-500' : 'text-dark-600'}`}>
                                Target: {chassis?.target_fan_percent || 0}%
                            </span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-1.5 mb-1">
                            <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${getFanColor()}`}
                                style={{ width: `${Math.min(100, smoothedTargetPercent)}%` }}
                            />
                        </div>
                        <div className={`text-right text-[10px] font-mono ${isFanFaulty ? 'text-red-500' : 'text-dark-500'}`}>
                            ~{Math.round(smoothedAvgFanRpm)} RPM
                        </div>
                    </div>
                </div>
            </div>

            {showFanModal && (
                <FanModal
                    fans={fans}
                    targetPercent={chassis?.target_fan_percent || 0}
                    onClose={() => setShowFanModal(false)}
                />
            )}
        </>
    );
};
