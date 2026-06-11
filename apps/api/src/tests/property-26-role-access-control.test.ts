import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { signToken } from '../lib/jwt';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/therapist-only', authenticate, requireRole('therapist'),
    (_req: Request, res: Response) => res.json({ ok: true }));

  app.get('/patient-only', authenticate, requireRole('patient'),
    (_req: Request, res: Response) => res.json({ ok: true }));

  app.use((err: any, _req: Request, res: Response, _next: any) => {
    res.status(err.status ?? 500).json({ error: err.code, message: err.message });
  });
  return app;
}

describe('Feature: coterapeuta-app, Property 26: Control de acceso basado en rol — rechazo universal', () => {
  const testApp = buildTestApp();

  it('patient token rejected on therapist-only endpoints with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ userId: fc.uuid(), email: fc.emailAddress() }),
        async ({ userId, email }) => {
          const token = signToken({ sub: userId, role: 'patient', email });
          const res = await request(testApp).get('/therapist-only').set('Authorization', `Bearer ${token}`);
          expect(res.status).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('therapist token rejected on patient-only endpoints with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ userId: fc.uuid(), email: fc.emailAddress() }),
        async ({ userId, email }) => {
          const token = signToken({ sub: userId, role: 'therapist', email });
          const res = await request(testApp).get('/patient-only').set('Authorization', `Bearer ${token}`);
          expect(res.status).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid role is accepted with 200', async () => {
    const token = signToken({ sub: 'user-1', role: 'therapist', email: 'doc@test.com' });
    const res = await request(testApp).get('/therapist-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
