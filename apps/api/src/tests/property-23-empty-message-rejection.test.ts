import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MessageBody } from '../modules/messages/message.schema';

describe('Feature: coterapeuta-app, Property 23: Rechazo de mensajes vacíos o con solo whitespace', () => {
  it('rejects empty or whitespace-only content with 422', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s*$/),
        (emptyContent) => {
          const result = MessageBody.safeParse({
            conversationId: '550e8400-e29b-41d4-a716-446655440000',
            content: emptyContent,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors[0].message).toBe('El mensaje no puede estar vacío');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts non-empty non-whitespace content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (validContent) => {
          const result = MessageBody.safeParse({
            conversationId: '550e8400-e29b-41d4-a716-446655440000',
            content: validContent,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
