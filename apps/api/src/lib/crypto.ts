import { randomUUID } from 'crypto';

export function generateInvitationCode(): string {
  return randomUUID();
}
