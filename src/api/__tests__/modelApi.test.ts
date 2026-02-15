import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCurrentModel, getAvailableModels, switchModel, startContainer, stopContainer } from '../modelApi';

global.fetch = vi.fn();

describe('modelApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentModel', () => {
    it('should fetch current model successfully', async () => {
      const mockModel = {
        name: 'GLM-4.7-Flash.gguf',
        alias: 'glm',
        status: 'ready' as const,
        ctx_size: 200000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModel,
      });

      const result = await getCurrentModel();

      expect(global.fetch).toHaveBeenCalledWith('/api/model/current');
      expect(result).toEqual(mockModel);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getCurrentModel()).rejects.toThrow('Failed to fetch current model');
    });
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

  describe('switchModel', () => {
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    it('should switch model successfully with JWT', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await switchModel('glm', mockJwt);

      expect(global.fetch).toHaveBeenCalledWith('/api/model/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockJwt}`,
        },
        body: JSON.stringify({ model: 'glm' }),
      });
    });

    it('should throw error on 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      await expect(switchModel('glm', 'invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should throw error on 403 forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(switchModel('glm', mockJwt)).rejects.toThrow('Access denied: Admin privileges required');
    });

    it('should throw error on 409 conflict (model switch in progress)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      await expect(switchModel('glm', mockJwt)).rejects.toThrow('Model switch already in progress');
    });

    it('should handle malformed JSON error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(switchModel('glm', mockJwt)).rejects.toThrow('Unknown error');
    });
  });

  describe('startContainer', () => {
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    it('should start container successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await startContainer(mockJwt);

      expect(global.fetch).toHaveBeenCalledWith('/api/llama/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockJwt}`,
        },
      });
    });

    it('should throw error on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container start failed' }),
      });

      await expect(startContainer(mockJwt)).rejects.toThrow('Container start failed');
    });
  });

  describe('stopContainer', () => {
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    it('should stop container successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await stopContainer(mockJwt);

      expect(global.fetch).toHaveBeenCalledWith('/api/llama/stop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockJwt}`,
        },
      });
    });

    it('should throw error on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Container stop failed' }),
      });

      await expect(stopContainer(mockJwt)).rejects.toThrow('Container stop failed');
    });
  });
});
