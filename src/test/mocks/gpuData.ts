import type { GPUStats, TemperGPUMetric, HostInfo } from '@/types/gpu';

export const mockGPU: TemperGPUMetric = {
  index: 0,
  name: 'NVIDIA RTX 4090',
  serial: 'GPU-12345678',
  vbios: '96.02.63.00.85',
  p_state: {
    id: 2,
    description: 'P2'
  },
  temperature: 72,
  fan_speed_percent: 65,
  target_fan_percent: 70,
  power_usage_mw: 350000,
  power_limit_mw: 450000,
  resources: {
    gpu_load_percent: 75,
    memory_load_percent: 60,
    memory_used_mb: 12000,
    memory_total_mb: 24000,
  },
  clocks: {
    graphics: 2520,
    memory: 10501,
    sm: 2520,
    video: 1950,
    max_graphics: 2580,
    max_memory: 10501,
  },
  pcie: {
    tx_throughput_kbs: 1024,
    rx_throughput_kbs: 2048,
    gen: 4,
    width: 16,
  },
  ecc: {
    volatile_single: 0,
    volatile_double: 0,
    aggregate_single: 0,
    aggregate_double: 0,
  },
  processes: [
    {
      pid: 1234,
      name: 'llama-server',
      used_memory: 8192,
    },
  ],
  throttle_alert: 'none',
};

export const mockHostInfo: HostInfo = {
  host: 'http://localhost:3001',
  host_metrics: {
    hostname: 'ai-server',
    cpu_load_percent: 42,
    memory_total_mb: 65536,
    memory_available_mb: 32768,
    load_avg_1m: 2.5,
    load_avg_5m: 2.3,
    uptime_seconds: 86400,
  },
  ai_service: {
    status: 'ready',
    load_progress: 1.0,
    model: 'GLM-4.7-Flash.gguf',
    model_path: '/models/GLM-4.7-Flash.gguf',
    n_ctx: 200000,
    slots_used: 1,
    slots_total: 4,
    prompt_tokens_seconds: 512,
    predicted_tokens_seconds: 24.5,
    prompt_tokens_total: 1024,
    prompt_seconds_total: 2.0,
    tokens_predicted_total: 512,
    tokens_predicted_seconds_total: 20.9,
    requests_processing: 1,
    requests_deferred: 0,
    n_decode_total: 512,
    n_tokens_max: 200000,
    n_busy_slots_per_decode: 0.25,
    kv_cache_usage_ratio: 0.01,
    kv_cache_tokens: 2048,
    slots: [
      {
        id: 0,
        n_ctx: 200000,
        tokens_cached: 0,
        state: 'processing',
        prompt_n: 50,
        prompt_ms: 100,
        predicted_n: 200,
        predicted_ms: 8000,
        cache_n: 0,
        kv_cache: {
          pos_min: 0,
          pos_max: 250,
          cells_used: 250,
          utilization: 0.00125,
          cache_efficiency: 0.0,
        },
        performance: {
          prompt_tokens_per_sec: 500,
          generation_tokens_per_sec: 25,
        },
      },
    ],
  },
};

export const mockGPUStats: GPUStats = {
  gpus: [
    {
      ...mockGPU,
      host: 'http://localhost:3001',
      uniqueId: 'localhost:3001-0',
      displayName: 'GPU 0',
    },
  ],
  hosts: [mockHostInfo],
  driver_version: '535.129.03',
  cuda_version: '12.2',
};

export const mockMultiGPUStats: GPUStats = {
  gpus: [
    {
      ...mockGPU,
      index: 0,
      host: 'http://localhost:3001',
      uniqueId: 'localhost:3001-0',
      displayName: 'GPU 0',
    },
    {
      ...mockGPU,
      index: 1,
      temperature: 68,
      fan_speed_percent: 60,
      power_usage_mw: 320000,
      host: 'http://localhost:3001',
      uniqueId: 'localhost:3001-1',
      displayName: 'GPU 1',
    },
  ],
  hosts: [mockHostInfo],
  driver_version: '535.129.03',
  cuda_version: '12.2',
};

export const mockLoadingAiService: HostInfo = {
  ...mockHostInfo,
  ai_service: {
    status: 'loading',
    load_progress: 0.45,
    model: 'GLM-4.7-Flash.gguf',
    slots_used: 0,
    slots_total: 4,
    prompt_tokens_seconds: 0,
    predicted_tokens_seconds: 0,
    prompt_tokens_total: 0,
    prompt_seconds_total: 0,
    tokens_predicted_total: 0,
    tokens_predicted_seconds_total: 0,
    requests_processing: 0,
    requests_deferred: 0,
    n_decode_total: 0,
    n_tokens_max: 200000,
    n_busy_slots_per_decode: 0,
    kv_cache_usage_ratio: 0,
    kv_cache_tokens: 0,
    slots: [],
  },
};

export const mockOfflineAiService: HostInfo = {
  ...mockHostInfo,
  ai_service: {
    status: 'offline',
    load_progress: 0,
    model: '',
    slots_used: 0,
    slots_total: 0,
    prompt_tokens_seconds: 0,
    predicted_tokens_seconds: 0,
    prompt_tokens_total: 0,
    prompt_seconds_total: 0,
    tokens_predicted_total: 0,
    tokens_predicted_seconds_total: 0,
    requests_processing: 0,
    requests_deferred: 0,
    n_decode_total: 0,
    n_tokens_max: 0,
    n_busy_slots_per_decode: 0,
    kv_cache_usage_ratio: 0,
    kv_cache_tokens: 0,
    slots: [],
  },
};
