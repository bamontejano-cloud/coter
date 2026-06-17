import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { signToken } from '../lib/jwt';
import type { JwtPayload } from '../lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-at-least-32-bytes-long!!';
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;
const TOLERANCE_SECONDS = 60;

/**
 * Validates: Requirements 1.4
 */
describe('Feature: coterapeuta-app, Property 3: JWT emitido contiene expiración de 8 horas', () => {
  it('el JWT emitido tiene exp a 8 horas (±60s) del momento de emisión', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.constantFrom('therapist', 'patient'),
        }),
        (payload) => {
          const before = Math.floor(Date.now() / 1000);
          const token = signToken(payload as JwtPayload);
          const after = Math.floor(Date.now() / 1000);

          const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
          expect(decoded.exp).toBeDefined();
          expect(decoded.iat).toBeDefined();

          // exp should be approximately iat + 8h
          const actualDuration = decoded.exp! - decoded.iat!;
          expect(actualDuration).toBeGreaterThanOrEqual(EIGHT_HOURS_IN_SECONDS - TOLERANCE_SECONDS);
          expect(actualDuration).toBeLessThanOrEqual(EIGHT_HOURS_IN_SECONDS + TOLERANCE_SECONDS);

          // exp should be in the right absolute range
          const expectedExp = before + EIGHT_HOURS_IN_SECONDS;
          expect(decoded.exp!).toBeGreaterThanOrEqual(expectedExp - TOLERANCE_SECONDS);
          expect(decoded.exp!).toBeLessThanOrEqual(after + EIGHT_HOURS_IN_SECONDS + TOLERANCE_SECONDS);
        }
      ),
      { numRuns: 100 }
    );
  });
});
