import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { authenticate } from '../middleware/authenticate';
import { signToken } from '../lib/jwt';
import jwt from 'jsonwebtoken';

// Install supertest: if not available, we'll build a lightweight test setup
// Note: we test the authenticate middleware directly by creating a mini Express app

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', authenticate, (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    res.status(err.status ?? 500).json({ error: err.code, message: err.message });
  });
  return app;
}

/**
 * Validates: Requirements 1.7, 7.5
 */
describe('Feature: coterapeuta-app, Property 5: Rechazo de requests sin token válido a rutas protegidas', () => {
  let testApp: express.Express;

  beforeEach(() => {
    testApp = buildTestApp();
  });

  it('rejects requests without Authorization header with 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(), // arbitrary path query (irrelevant)
        async () => {
          const res = await request(testApp).get('/protected');
          expect(res.status).toBe(401);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('rejects requests with tampered/invalid token with 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (garbage) => {
          const res = await request(testApp)
            .get('/protected')
            .set('Authorization', `Bearer ${garbage}`);
          expect(res.status).toBe(401);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('rejects requests with token signed by wrong secret with 401', async () => {
    const wrongSecret = 'completely-wrong-secret-key-9999';
    const fakeToken = jwt.sign({ sub: 'user-id', role: 'therapist', email: 'test@test.com' }, wrongSecret, { expiresIn: '8h' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  it('accepts valid JWT and returns 200', async () => {
    const token = signToken({ sub: 'user-1', role: 'therapist', email: 'doc@test.com' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
