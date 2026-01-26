import {} from 'react';
import { useQuery } from 'react-query';
import { fetchGPUStats } from '../api/gpuApi';
import type { GPUStats } from '../types/gpu';

interface TemperGPUMetric {
  index: number;
  name: string;
  temperature: number;
  power_usage_mw: number;
  utilization: { gpu: number };
}

export const GPUSelector: React.FC<{
  selectedGPU: string;
  onSelectGPU: (gpuId: string) => void;
}> = ({ selectedGPU, onSelectGPU }) => {
  const { data: stats, isLoading, error } = useQuery<Promise<GPUStats>>(
    'gpu-stats',
    fetchGPUStats,
    {
      refetchInterval: 5000,
      staleTime: 5000,
    }
  );

  if (error) {
    return (
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h3 className="text-lg font-semibold mb-3">GPU Selection</h3>
        <div className="text-red-400 text-sm">
          Failed to load GPU data
        </div>
      </div>
    );
  }

  const gpus = (stats as any)?.gpus || [];

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
      <h3 className="text-lg font-semibold mb-3">GPU Selection</h3>
      {isLoading ? (
        <div className="text-dark-600 text-sm">Loading GPUs...</div>
      ) : (
        <div className="space-y-2">
          <button
            key="all"
            onClick={() => onSelectGPU('all')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              selectedGPU === 'all'
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan'
                : 'bg-dark-700 hover:bg-dark-600 text-white'
            }`}
          >
            <div className="font-medium">All GPUs</div>
          </button>
          {gpus.length === 0 ? (
            <div className="text-dark-600 text-sm">No GPUs detected</div>
          ) : (
            gpus.map((gpu: TemperGPUMetric) => (
              <button
                key={gpu.index}
                onClick={() => onSelectGPU(gpu.index.toString())}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedGPU === gpu.index.toString()
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan'
                    : 'bg-dark-700 hover:bg-dark-600 text-white'
                }`}
              >
                <div className="font-medium">GPU {gpu.index}</div>
                <div className="text-xs text-dark-600 mt-1">
                  {gpu.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
