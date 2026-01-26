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

export interface GPUStats {
  gpus: TemperGPUMetric[];
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
