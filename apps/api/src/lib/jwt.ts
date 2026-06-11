import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;    // user id
  role: string;   // 'therapist' | 'patient'
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
