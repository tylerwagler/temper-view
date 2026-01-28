export interface TemperGPUMetric {
  index: number;
  name: string;
  serial: string;
  vbios: string;
  p_state: {
    id: number;
    description: string;
  };
  temperature: number; // Celsius
  fan_speed_percent: number;
  target_fan_percent: number;
  power_usage_mw: number; // milliwatts
  power_limit_mw: number;
  resources: {
    gpu_load_percent: number;
    memory_load_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
  };
  clocks: {
    graphics: number;
    memory: number;
    sm: number;
    video: number;
    max_graphics: number;
    max_memory: number;
  };
  pcie: {
    tx_throughput_kbs: number;
    rx_throughput_kbs: number;
    gen: number;
    width: number;
  };
  ecc: {
    volatile_single: number;
    volatile_double: number;
    aggregate_single: number;
    aggregate_double: number;
  };
  processes: Array<{
    pid: number;
    name: string;
    used_memory: number;
  }>;
  throttle_alert: string;
}

export interface HostMetrics {
  hostname: string;
  cpu_load_percent: number;
  memory_total_mb: number;
  memory_available_mb: number;
  load_avg_1m: number;
  load_avg_5m: number;
  uptime_seconds: number;
}

export interface ChassisMetrics {
  ipmi_available: boolean;
  inlet_temp_c: number;
  exhaust_temp_c: number;
  power_consumption_w: number;
  cpu_temps_c: number[];
  fans_rpm: number[];
  target_fan_percent: number;
  psu1_current_a: number;
  psu2_current_a: number;
  psu1_voltage_v: number;
  psu2_voltage_v: number;
}

export interface SlotKVCacheMetrics {
  pos_min: number;        // -1 if empty, >= 0 if used
  pos_max: number;        // -1 if empty, >= 0 if used
  cells_used: number;     // 0 if empty, > 0 if used
  utilization: number;    // 0.0-1.0 (pos_max / n_ctx)
  cache_efficiency: number; // 0.0-1.0 (cached / total)
}

export interface SlotPerformanceMetrics {
  prompt_tokens_per_sec: number;
  generation_tokens_per_sec: number;
  speculative_acceptance_rate?: number;
  draft_tokens_total?: number;
  draft_tokens_accepted?: number;
}

export interface SlotMetrics {
  id: number;
  n_ctx: number;
  tokens_cached: number; // Legacy field for backward compatibility
  state: string;
  prompt_n: number;
  prompt_ms: number;
  predicted_n: number;
  predicted_ms: number;
  cache_n: number;
  kv_cache?: SlotKVCacheMetrics;  // New per-slot KV cache metrics
  performance?: SlotPerformanceMetrics | null; // New per-slot performance metrics
}

export interface AiServiceMetrics extends LlamaMetrics {
  status: string;
  model: string;
  model_path?: string;
  n_ctx?: number;
  slots_used: number;
  slots_total: number;
  slots?: SlotMetrics[];
}

export interface HostInfo {
  host: string;
  host_metrics: HostMetrics;
  chassis_metrics: ChassisMetrics;
  ai_service?: AiServiceMetrics;
}

export interface GPUStats {
  gpus: (TemperGPUMetric & { host?: string; uniqueId?: string; displayName?: string })[];
  hosts: HostInfo[];
  driver_version: string;
  cuda_version: string;
}

// Convert Temper's milliwatts to watts
export const MW_TO_W = 0.001;

// Convert Temper's bytes to MB
export const BYTES_TO_MB = 1 / (1024 * 1024);

// Convert Temper's KB/s to MB/s
export const KB_TO_MB = 1 / 1024;

export interface GPUTelemetryWebSocketMessage {
  type: 'metric' | 'stats' | 'error' | 'connected' | 'disconnected';
  data?: any;
  timestamp: number;
}

// Llama.cpp Router Types
export interface LlamaModel {
  id: string;
  object: string;
  owned_by: string;
  created: number;
  status: {
    value: 'loaded' | 'unloaded';
    args?: string[];
    preset?: string;
  };
}

export interface LlamaSlotToken {
  has_next_token: boolean;
  has_new_line: boolean;
  n_remain: number;
  n_decoded: number;
}

export interface LlamaSlot {
  id: number;
  n_ctx: number;
  speculative: boolean;
  is_processing: boolean;
  id_task: number;
  next_token?: LlamaSlotToken[];
}

export interface LlamaMetrics {
  prompt_tokens_total: number;
  prompt_seconds_total: number;
  tokens_predicted_total: number;
  tokens_predicted_seconds_total: number;
  prompt_tokens_seconds: number;
  predicted_tokens_seconds: number;
  requests_processing: number;
  requests_deferred: number;
  n_decode_total: number;
  n_tokens_max: number;
  n_busy_slots_per_decode: number;
  kv_cache_usage_ratio: number;
  kv_cache_tokens: number;
}

export interface LlamaStats {
  models: LlamaModel[];
  activeSlots: LlamaSlot[];
  loadedModel?: LlamaModel;
  metrics?: LlamaMetrics;
}

