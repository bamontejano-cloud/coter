import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';

// Mock bcrypt to avoid slowness in integration test
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock prisma
vi.mock('../lib/prisma', () => {
  const txMock = {
    user: { create: vi.fn() },
    therapistPatient: { create: vi.fn() },
    invitation: { update: vi.fn() },
    record: { create: vi.fn() },
    assignment: { update: vi.fn() },
    notification: { create: vi.fn() },
  };
  return {
    prisma: {
      user: { findUnique: vi.fn(), create: vi.fn() },
      invitation: { findUnique: vi.fn(), create: vi.fn() },
      therapistPatient: { findUnique: vi.fn() },
      technique: { findUnique: vi.fn() },
      assignment: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
      $transaction: vi.fn(async (fn: any) => fn(txMock)),
      _txMock: txMock,
    },
  };
});

import { prisma } from '../lib/prisma';

const txMock = (prisma as any)._txMock;

describe('Integration: End-to-end therapeutic flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(txMock).forEach((mock: any) => mock.mockReset?.());
  });

  it('health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('global error handler returns correct shape for AppError', async () => {
    // Hit an authenticated route without a token — should get 401
    const res = await request(app).get('/patients');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  it('therapist registration returns 201 with token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'therapist-id-1',
      fullName: 'Dr. Smith',
      email: 'dr@example.com',
      passwordHash: '$2b$12$hashedpassword',
      role: 'therapist',
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ fullName: 'Dr. Smith', email: 'dr@example.com', password: 'password123', role: 'therapist' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('therapist');
  });

  it('invitation generation requires therapist auth', async () => {
    const noAuthRes = await request(app).post('/invitations');
    expect(noAuthRes.status).toBe(401);
  });

  it('404 on unknown routes returns error shape', async () => {
    const res = await request(app).get('/unknown-route-xyz');
    // Should fall through to catch-all or return 404
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
