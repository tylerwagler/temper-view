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
}

export interface HostInfo {
  host: string;
  host_metrics: HostMetrics;
  chassis_metrics: ChassisMetrics;
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
