export interface ModelInfo {
  name: string;
  alias: string;
  status: 'ready' | 'loading' | 'switching' | 'offline';
  ctx_size: number;
  switched_at?: string;
}

export async function getCurrentModel(): Promise<ModelInfo> {
  const response = await fetch('/api/model/current');
  if (!response.ok) {
    throw new Error('Failed to fetch current model');
  }
  return response.json();
}

export async function getAvailableModels(): Promise<ModelInfo[]> {
  const response = await fetch('/api/model/available');
  if (!response.ok) {
    throw new Error('Failed to fetch available models');
  }
  return response.json();
}

export async function switchModel(modelName: string, jwt: string): Promise<void> {
  console.log('[modelApi] switchModel called with model:', modelName, 'token length:', jwt?.length);

  const response = await fetch('/api/model/switch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({ model: modelName })
  });

  console.log('[modelApi] Response status:', response.status);

  if (response.status === 401) {
    const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
    console.error('[modelApi] 401 response:', error);
    throw new Error(error.error || 'Missing authorization token');
  }
  if (response.status === 403) {
    throw new Error('Access denied: Admin privileges required');
  }
  if (response.status === 409) {
    throw new Error('Model switch already in progress');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[modelApi] Error response:', error);
    throw new Error(error.error || 'Failed to switch model');
  }
}

export async function startContainer(jwt: string): Promise<void> {
  const response = await fetch('/api/llama/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to start container' }));
    throw new Error(error.error);
  }
}

export async function stopContainer(jwt: string): Promise<void> {
  const response = await fetch('/api/llama/stop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to stop container' }));
    throw new Error(error.error);
  }
}
