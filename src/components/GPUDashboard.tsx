import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchGPUStats } from '../api/gpuApi';

import { ClocksCard } from './charts/ClocksCard';
import { PCIeCard } from './charts/PCIeCard';
import { GPUDetailsModal } from './GPUDetailsModal';
import { PowerThermalCard } from './charts/PowerThermalCard';
import { UtilMemoryCard } from './charts/UtilMemoryCard';

export const GPUDashboard: React.FC = () => {
  const [selectedGPU, setSelectedGPU] = useState<any>(null);

  // Fetch initial stats - 100 Hz polling
  const { data: stats, isLoading, error } = useQuery<any>(
    ['gpu-stats', 'all'],
    () => fetchGPUStats(),
    {
      refetchInterval: 10, // 100 Hz
      staleTime: 0,
    }
  );

  const gpus = stats?.gpus || [];

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 p-6 sticky top-0 z-10 shadow-lg bg-opacity-90 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-cyan to-blue-500 bg-clip-text text-transparent">
              GPU Telemetry Dashboard
            </h1>
            <p className="text-dark-400 text-sm mt-1">Real-time monitoring from Temper</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse"></div>
            <span className="text-xs text-accent-green font-mono">Normal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Charts Grid */}
          <main className="lg:col-span-4">
            {isLoading ? (
              <div className="bg-dark-800 rounded-lg p-12 text-center">
                <div className="text-dark-600">Loading telemetry data...</div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center text-red-400">
                Failed to load GPU data. Is the API running?
              </div>
            ) : gpus.length === 0 ? (
              <div className="bg-dark-800 rounded-lg p-12 text-center text-dark-400">
                <p className="text-xl mb-2">No GPUs Detected</p>
                <p className="text-sm">The API is reachable but returned 0 GPUs. Check your Temper configuration.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {gpus.map((g: any) => {
                  const HARDWARE_MAX_W = 230;

                  return (
                    <div key={g.index} className="space-y-4">
                      {/* Clickable Header for Modal */}
                      <button
                        onClick={() => setSelectedGPU(g)}
                        className="flex items-center gap-3 group text-left w-full hover:bg-dark-800/50 p-2 -ml-2 rounded-lg transition-all"
                      >
                        <h2 className="text-xl font-bold text-white group-hover:text-accent-cyan transition-colors">
                          GPU {g.index} - {g.name}
                        </h2>
                        <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded border border-dark-700 group-hover:border-accent-cyan/30 transition-colors">
                          View Details ↗
                        </span>
                      </button>

                      {/* Row 1: Primary Metrics (2 Combined Cards) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Utilization & Memory (Combined) - Spans 2 Cols */}
                        <div className="md:col-span-2">
                          <UtilMemoryCard
                            gpuLoadPercent={g.resources?.gpu_load_percent ?? 0}
                            memoryLoadPercent={g.resources?.memory_load_percent ?? 0}
                            memoryUsedMB={g.resources?.memory_used_mb ?? 0}
                            memoryTotalMB={g.resources?.memory_total_mb ?? 0}
                            gpuLabel={`GPU ${g.index}`}
                          />
                        </div>

                        {/* Power & Thermals (Combined) - Spans 2 Cols */}
                        <div className="md:col-span-2">
                          <PowerThermalCard
                            temperature={g.temperature ?? 0}
                            fanSpeedPercent={g.fan_speed_percent ?? 0}
                            targetFanPercent={g.target_fan_percent ?? 0}
                            powerUsageW={Math.round((g.power_usage_mw ?? 0) * 0.001)}
                            powerLimitW={Math.round((g.power_limit_mw ?? 0) * 0.001)}
                            hardwareMaxW={HARDWARE_MAX_W}
                            gpuLabel={`GPU ${g.index}`}
                          />
                        </div>
                      </div>

                      {/* Row 2: Detailed Telemetry */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Clocks (Spans 2 columns) */}
                        <div className="xl:col-span-2">
                          <ClocksCard
                            clocks={g.clocks}
                            pState={g.p_state}
                            gpuLabel={`GPU ${g.index}`}
                          />
                        </div>

                        {/* PCIe (Expanded to 2 columns now that Metadata is gone) */}
                        <div className="xl:col-span-2">
                          <PCIeCard pcie={g.pcie} gpuLabel={`GPU ${g.index}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Status Bar */}

      </div>

      {/* Details Modal */}
      <GPUDetailsModal
        gpu={selectedGPU}
        onClose={() => setSelectedGPU(null)}
      />
    </div>
  );
};
