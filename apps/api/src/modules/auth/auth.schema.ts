import { z } from 'zod';
import { ROLE_TUPLE } from '@coterapeuta/shared';

export const RegisterBody = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  role: z.enum(ROLE_TUPLE),
  invitationCode: z.string().optional(),
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;
export type LoginBodyType = z.infer<typeof LoginBody>;
