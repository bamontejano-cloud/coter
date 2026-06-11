import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RecordBody } from '../modules/records/record.schema';

/**
 * Property 19: Rechazo de registros vacíos o con solo whitespace
 * Validates: Requirements 5.3
 */
describe('Feature: coterapeuta-app, Property 19: Rechazo de registros vacíos o con solo whitespace', () => {
  it('rejects empty or whitespace-only response with Zod validation error', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s*$/), // empty or whitespace-only strings
        (emptyResponse) => {
          const result = RecordBody.safeParse({
            assignmentId: '550e8400-e29b-41d4-a716-446655440000',
            response: emptyResponse,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors[0].message).toBe('El campo de respuesta es obligatorio');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts non-empty, non-whitespace response', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (validResponse) => {
          const result = RecordBody.safeParse({
            assignmentId: '550e8400-e29b-41d4-a716-446655440000',
            response: validResponse,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
