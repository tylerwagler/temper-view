import { http, HttpResponse } from 'msw';
import { mockGPUStats } from './gpuData';

export const handlers = [
  // Mock GPU metrics endpoint
  http.get('http://localhost:3000/api/metrics', () => {
    return HttpResponse.json(mockGPUStats);
  }),

  // Mock Supabase auth endpoints
  http.post('http://localhost:8004/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    });
  }),

  // Mock Supabase user endpoint
  http.get('http://localhost:8004/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      role: 'authenticated',
    });
  }),
];
