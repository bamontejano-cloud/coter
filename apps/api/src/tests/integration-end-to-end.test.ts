import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { userService } from '../lib/userService';
import { Errors } from '../lib/errors';

// Mock UserService at the module level — the auth router calls userService.register /
// userService.login, so spying on these methods instead of mocking prisma keeps the
// test stable as the internal Prisma queries evolve.
vi.mock('../lib/userService', () => ({
  userService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

const stubAuthResponse = {
  user: {
    id: 'therapist-id-1',
    fullName: 'Dr. Smith',
    email: 'dr@example.com',
    role: 'therapist' as const,
  },
  token: 'mock-jwt-token',
};

describe('Auth router integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('global error handler returns correct shape for AppError', async () => {
    const res = await request(app).get('/patients');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('therapist registration returns 201 with token (UserService.register)', async () => {
    vi.mocked(userService.register).mockResolvedValueOnce(stubAuthResponse);

    const res = await request(app)
      .post('/auth/register')
      .send({ fullName: 'Dr. Smith', email: 'dr@example.com', password: 'password123', role: 'therapist' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('therapist');
    expect(userService.register).toHaveBeenCalledTimes(1);
  });

  it('login returns token (UserService.login)', async () => {
    vi.mocked(userService.login).mockResolvedValueOnce(stubAuthResponse);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'dr@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('therapist');
    expect(userService.login).toHaveBeenCalledTimes(1);
  });

  it('login propagates invalid-credentials from UserService', async () => {
    vi.mocked(userService.login).mockRejectedValueOnce(Errors.invalidCredentials());

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'dr@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_credentials');
  });

  it('invitation generation requires therapist auth', async () => {
    const res = await request(app).post('/invitations');
    expect(res.status).toBe(401);
  });

  it('404 on unknown routes returns error shape', async () => {
    const res = await request(app).get('/unknown-route-xyz');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
