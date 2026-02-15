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

  // Default to both local (via nginx proxy) and Sparky (direct)
  return ['/api', 'http://10.20.10.10:3001'];
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

      // Temporary fix for backend returning invalid JSON (inf/nan)
      const rawText = await res.text();
      // Replace non-compliant numeric values with null
      const safeJson = rawText.replace(/: ?(inf|-inf|nan)/gi, ': null');

      try {
        return { host, data: JSON.parse(safeJson) };
      } catch {
        throw new Error(`Invalid JSON response from ${host}`);
      }
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
        ai_service: data.ai_service
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

  // Validate GPU ID input
  if (!gpuId || !/^\d+$/.test(gpuId)) {
    throw new Error('Invalid GPU ID: must be a non-empty numeric string');
  }

  const index = parseInt(gpuId, 10);
  if (index < 0) {
    throw new Error('GPU index cannot be negative');
  }

  if (index >= stats.gpus.length) {
    throw new Error(`GPU index ${index} out of range (available: 0-${stats.gpus.length - 1})`);
  }

  const gpu = stats.gpus.find((g: any) => g.index === index);
  if (!gpu) {
    // This should never happen due to the range check above, but keep as safety net
    throw new Error(`GPU index ${index} not found`);
  }

  return [gpu];
}
