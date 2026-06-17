import jwt from 'jsonwebtoken';
import type { Role } from '@coterapeuta/shared';

export interface JwtPayload {
  sub: string;    // user id
  role: Role;     // 'therapist' | 'patient'
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-at-least-32-bytes-long!!';
const EXPIRY = '8h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function toJwtPayload(user: { id: string; role: string; email: string }): JwtPayload {
  return { sub: user.id, role: user.role as Role, email: user.email };
}
