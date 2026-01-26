import type { TemperGPUMetric, GPUStats } from '../types/gpu';

const getApiHosts = (): string[] => {
  // Check localStorage for the configured hosts
  const configuredHosts = localStorage.getItem('temper_remote_hosts');
  if (configuredHosts) {
    try {
      return JSON.parse(configuredHosts);
    } catch {
      return [];
    }
  }

  // Legacy fallback
  const single = localStorage.getItem('temper_remote_host');
  if (single) return [single];

  // Default/Env fallback if nothing configured
  const env = import.meta.env.VITE_GPU_API_BASE;
  if (env) return [env];

  return [];
};

/**
 * Fetch GPU statistics from Temper API(s)
 * Aggregates results from multiple configured hosts
 */
export async function fetchGPUStats(): Promise<GPUStats> {
  const hosts = getApiHosts();

  if (hosts.length === 0) {
    // Special error to signal UI to show "Add Host" prompt
    throw new Error('NO_HOSTS_CONFIGURED');
  }

  const results = await Promise.allSettled(
    hosts.map(async (host) => {
      const url = `${host.replace(/\/$/, '')}/metrics`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { host, data: await res.json() };
    })
  );

  const aggregatedGpus: any[] = [];
  const aggregatedHosts: any[] = [];

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const { host, data } = result.value;

      // Collect host-level metrics - always add host, even with partial data
      aggregatedHosts.push({
        host,
        host_metrics: data.host || {},
        chassis_metrics: data.chassis || { ipmi_available: false }
      });

      if (data.gpus && Array.isArray(data.gpus)) {
        // Add host context to each GPU
        const hostGpus = data.gpus.map((g: any) => ({
          ...g,
          host: host,
          uniqueId: `${host}-${g.index}`, // for React keys
          displayName: `${g.name} (${host})` // Optional for UI differentiation
        }));
        aggregatedGpus.push(...hostGpus);
      }
    }
    // We silently ignore failed hosts for now, or could track errors
  });

  return {
    gpus: aggregatedGpus,
    hosts: aggregatedHosts,
    driver_version: 'mixed',
    cuda_version: 'mixed'
  };
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
