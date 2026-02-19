import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAvailableModels } from '../modelApi';

global.fetch = vi.fn();

describe('modelApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableModels', () => {
    it('should fetch available models successfully', async () => {
      const mockModels = [
        { name: 'GLM-4.7-Flash.gguf', alias: 'glm', status: 'ready' as const, ctx_size: 200000 },
        { name: 'Nemotron-3-Nano.gguf', alias: 'nemotron', status: 'offline' as const, ctx_size: 200000 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      });

      const result = await getAvailableModels();

      expect(global.fetch).toHaveBeenCalledWith('/api/model/available');
      expect(result).toEqual(mockModels);
      expect(result).toHaveLength(2);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getAvailableModels()).rejects.toThrow('Failed to fetch available models');
    });
  });
});
