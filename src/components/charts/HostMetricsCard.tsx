import React, { useState } from 'react';
import { GaugeChart } from './GaugeChart';
import { useSmoothedValue } from '../../hooks/useSmoothedValue';
import type { HostMetrics, ChassisMetrics } from '../../types/gpu';

interface HostMetricsCardProps {
    // host: string; // Unused
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
                        {fans.map((rpm, idx) => (
                            <div key={idx} className="p-3 bg-dark-900/50 rounded-lg border border-dark-700">
                                <div className="text-xs text-dark-500 mb-1">Fan {idx}</div>
                                <div className="text-lg font-mono text-white">{rpm} <span className="text-xs text-dark-600">RPM</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HostMetricsCard: React.FC<HostMetricsCardProps> = ({ metrics, chassis, onHide }) => {
    const [showFanModal, setShowFanModal] = useState(false);
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

    return (
        <>
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 h-full min-w-[220px] max-w-[220px] relative group">
                <div className="flex justify-between items-center mb-4 pr-6">
                    <h3 className="text-lg font-semibold text-white">Host</h3>
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
                    {/* CPU Load & Power */}
                    <div className="flex flex-col items-center justify-center p-1 border-b border-dark-700 pb-2">
                        <GaugeChart
                            value={smoothedCpu}
                            max={100}
                            label=""
                            unit="%"
                            title="CPU Load"
                            subtitle={`${chassis?.power_consumption_w || 0}W`}
                            color="#22c55e"
                            minimal
                        />
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

                    {/* Consolidated Temps (Chassis + CPU) */}
                    <div className="px-2 border-b border-dark-700 pb-3">
                        <div className="text-[10px] text-dark-500 mb-2 text-center">Temperature</div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {/* Chassis Temps */}
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-dark-600">Inlet</span>
                                <span className="text-sm font-bold text-green-400 font-mono">{chassis?.inlet_temp_c || 0}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-dark-600">Exhaust</span>
                                <span className="text-sm font-bold text-orange-400 font-mono">{chassis?.exhaust_temp_c || 0}°C</span>
                            </div>
                            {/* CPU Temps */}
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
                                className={`h-1.5 rounded-full transition-all duration-300 ${isFanFaulty ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${chassis?.target_fan_percent || 0}%` }}
                            />
                        </div>
                        <div className={`text-right text-[10px] font-mono ${isFanFaulty ? 'text-red-500' : 'text-dark-500'}`}>
                            ~{avgFan} RPM
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
