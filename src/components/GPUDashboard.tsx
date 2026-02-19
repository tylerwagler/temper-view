import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGPUStats } from '../api/gpuApi';
import { getAvailableModels } from '../api/modelApi';

import { GPUDetailsModal } from './GPUDetailsModal';
import { CombinedGPUCard } from './charts/CombinedGPUCard';
import { HostMetricsCard } from './charts/HostMetricsCard';
import { Settings, ShieldCheck, ShieldAlert } from 'lucide-react';

interface GPUDashboardProps {
  onOpenSettings?: () => void;
  hideHeader?: boolean;
  isAdmin?: boolean;
  session?: any;
}

export const GPUDashboard: React.FC<GPUDashboardProps> = ({ onOpenSettings, hideHeader = false, isAdmin = false }) => {
  const [selectedGPU, setSelectedGPU] = useState<any>(null);
  const [hiddenGPUMetrics, setHiddenGPUMetrics] = useState<Set<number>>(new Set());
  const [hiddenHostMetrics, setHiddenHostMetrics] = useState<Set<string>>(new Set());

  const lastValidDataRef = useRef<{ gpus: any[]; hosts: any[] }>({ gpus: [], hosts: [] });

  const toggleGPUMetricsVisibility = (index: number, show?: boolean) => {
    const newHidden = new Set(hiddenGPUMetrics);
    if (show === true) newHidden.delete(index);
    else if (show === false) newHidden.add(index);
    else newHidden.has(index) ? newHidden.delete(index) : newHidden.add(index);
    setHiddenGPUMetrics(newHidden);
  };

  const toggleHostMetricsVisibility = (host: string, show?: boolean) => {
    const newHidden = new Set(hiddenHostMetrics);
    if (show === true) newHidden.delete(host);
    else if (show === false) newHidden.add(host);
    else newHidden.has(host) ? newHidden.delete(host) : newHidden.add(host);
    setHiddenHostMetrics(newHidden);
  };

  const { data: stats, isLoading, error, isFetched } = useQuery({
    queryKey: ['gpu-stats', 'all'],
    queryFn: () => fetchGPUStats(),
    refetchInterval: 1000,
    staleTime: 0,
    retry: 0,
    retryDelay: 1000,
  });

  const { data: availableModels } = useQuery({
    queryKey: ['available-models'],
    queryFn: getAvailableModels,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (stats?.gpus && stats.gpus.length > 0) {
      const gpusChanged = lastValidDataRef.current.gpus !== stats.gpus;
      const hostsChanged = lastValidDataRef.current.hosts !== (stats.hosts || []);

      if (gpusChanged || hostsChanged) {
        lastValidDataRef.current = {
          gpus: stats.gpus,
          hosts: stats.hosts || []
        };
      }
    } else if (stats?.hosts && stats.hosts.length > 0) {
      const hostsChanged = lastValidDataRef.current.hosts !== stats.hosts;

      if (hostsChanged) {
        lastValidDataRef.current = {
          gpus: stats.gpus || [],
          hosts: stats.hosts
        };
      }
    }
  }, [stats]);

  const gpus = lastValidDataRef.current.gpus;
  const hostsData = lastValidDataRef.current.hosts;

  const isSystemHealty = useMemo(
    () => hostsData.length > 0,
    [hostsData]
  );

  const showNoData = !isLoading && isFetched && gpus.length === 0 && hostsData.length === 0;

  return (
    <div className={`min-h-screen bg-dark-900 text-white font-sans ${hideHeader ? 'bg-transparent' : ''}`}>
      {!hideHeader && (
        <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10 shadow-lg bg-opacity-90 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-2 gap-4 md:gap-0">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-accent-cyan to-blue-500 bg-clip-text text-transparent">
                TemperView
              </h1>
              <button
                onClick={onOpenSettings}
                className="text-dark-400 hover:text-white transition-colors p-1 rounded-md hover:bg-dark-700"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0">
              {gpus.map((g: any, idx: number) => {
                const isHidden = hiddenGPUMetrics.has(g.index);
                return (
                  <div
                    key={g.uniqueId || idx}
                    onClick={() => setSelectedGPU(g)}
                    className={`flex flex-col justify-center px-3 py-1.5 rounded border cursor-pointer transition-all min-w-12 ${isHidden
                      ? 'bg-dark-900 border-dashed border-dark-600'
                      : 'bg-dark-900 border-dark-700 hover:border-accent-cyan hover:bg-dark-800'
                      }`}
                    title={isHidden ? "Click to Show" : "Click for Details"}
                  >
                    <span className="text-[10px] font-bold uppercase text-dark-600">
                      GPU {g.index}
                    </span>
                    <span className={`text-sm font-semibold whitespace-nowrap truncate max-w-[200px] ${isHidden ? 'text-dark-400 italic' : 'text-white'}`}>
                      {g.name}
                    </span>
                  </div>
                );
              })}

              <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-dark-900/50 rounded-full border border-dark-700">
                {isSystemHealty ? (
                  <ShieldCheck className="w-4 h-4 text-accent-green" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                )}
                <span className="text-[10px] font-bold uppercase text-dark-400">
                  {isSystemHealty ? 'System Normal' : 'System Alert'}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={hideHeader ? 'p-0' : 'p-3'}>
        <main className={hideHeader ? 'w-full' : 'w-full'}>
          {isLoading ? (
            <div className="bg-dark-800 rounded-lg p-12 text-center">
              <div className="text-dark-600 animate-pulse">Loading telemetry data...</div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center text-red-400">
              {error.message === 'NO_HOSTS_CONFIGURED' ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xl text-white">No Remote Hosts Configured</p>
                  <p className="text-sm opacity-70">Please add at least one Temper API host to monitor.</p>
                  <button
                    onClick={onOpenSettings}
                    className="bg-accent-cyan text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors"
                  >
                    Configure Hosts
                  </button>
                </div>
              ) : (
                <>Failed to load GPU data: {error.message}</>
              )}
            </div>
          ) : showNoData ? (
            <div className="bg-dark-800 rounded-lg p-12 text-center text-dark-400">
              <p className="text-xl mb-2">No Data Detected</p>
              <p className="text-sm">The API is reachable but returned no host or GPU data. Check your Temper configuration.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {hostsData.map((h: any) => {
                const hostGpus = gpus.filter((g: any) => g.host === h.host);
                const isHostMetricsHidden = hiddenHostMetrics.has(h.host);

                return (
                  <section key={h.host} className="space-y-6">
                    <div className="flex flex-wrap gap-3 items-stretch">
                      <div className="flex-none flex gap-3">
                        {!isHostMetricsHidden && (
                          <HostMetricsCard
                            host={h.host}
                            metrics={h.host_metrics}
                            onHide={() => toggleHostMetricsVisibility(h.host, false)}
                            aiService={h.ai_service}
                            availableModels={availableModels}
                          />
                        )}
                      </div>

                      {hostGpus.map((g: any) => {
                        if (hiddenGPUMetrics.has(g.index)) return null;

                        return (
                          <div key={g.uniqueId || g.index} className="flex-1 max-w-[calc(50%-0.375rem)]">
                            <CombinedGPUCard
                              gpuLoadPercent={g.resources?.gpu_load_percent ?? 0}
                              memoryLoadPercent={g.resources?.memory_load_percent ?? 0}
                              memoryUsedMB={g.resources?.memory_used_mb ?? 0}
                              memoryTotalMB={g.resources?.memory_total_mb ?? 0}
                              temperature={g.temperature ?? 0}
                              fanSpeedPercent={g.fan_speed_percent ?? 0}
                              targetFanPercent={g.target_fan_percent ?? 0}
                              powerUsageW={Math.round((g.power_usage_mw ?? 0) * 0.001)}
                              powerLimitW={Math.round((g.power_limit_mw ?? 0) * 0.001)}
                              hardwareMaxW={Math.round((g.power_max_mw ?? g.power_limit_mw ?? 0) * 0.001)}
                              clocks={g.clocks}
                              pState={g.p_state}
                              pcie={g.pcie}
                              nvlink={g.nvlink}
                              gpuName={g.name ?? 'GPU'}
                              gpuLabel={g.host ? `${g.host.replace(/https?:\/\//, '').split(':')[0]}: GPU${g.index}` : `GPU ${g.index}`}
                              onHide={() => toggleGPUMetricsVisibility(g.index, false)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <GPUDetailsModal
        gpu={selectedGPU}
        onClose={() => setSelectedGPU(null)}
        isGPUMetricsHidden={selectedGPU ? hiddenGPUMetrics.has(selectedGPU.index) : false}
        isHostHidden={selectedGPU && selectedGPU.host ? hiddenHostMetrics.has(selectedGPU.host) : false}
        onToggleGPUMetrics={() => selectedGPU && toggleGPUMetricsVisibility(selectedGPU.index)}
        onToggleHost={() => selectedGPU && selectedGPU.host && toggleHostMetricsVisibility(selectedGPU.host)}
      />
    </div>
  );
};
