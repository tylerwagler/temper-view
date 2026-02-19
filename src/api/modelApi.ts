export interface ModelInfo {
  name: string;
  alias: string;
  status: 'ready' | 'loading' | 'switching' | 'offline';
  ctx_size: number;
  max_ctx?: number;
  parallel?: number;
  cache_type?: string;
  vram_base?: number;
  vram_per_1k_ctx?: number;
  switched_at?: string;
  backend?: string;
  host?: string;
  is_local?: boolean;
}

export async function getAvailableModels(): Promise<ModelInfo[]> {
  const response = await fetch('/api/model/available');
  if (!response.ok) {
    throw new Error('Failed to fetch available models');
  }
  return response.json();
}
