import type { TemperGPUMetric, GPUStats } from '../types/gpu';

const API_BASE = import.meta.env.VITE_GPU_API_BASE || '/api';

/**
 * Fetch GPU statistics from Temper API
 * Endpoint: GET /metrics
 */
export async function fetchGPUStats(): Promise<GPUStats> {
  const response = await fetch(`${API_BASE}/metrics`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GPU stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch individual GPU metrics (mapped from Temper's /metrics response)
 */
export async function fetchGPUMetrics(gpuId: string): Promise<TemperGPUMetric[]> {
  const stats = await fetchGPUStats();
  const gpu = stats.gpus.find((g: any) => g.index === parseInt(gpuId));
  if (!gpu) {
    throw new Error(`GPU ${gpuId} not found`);
  }
  return [gpu];
}
