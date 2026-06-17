import { userService } from '../../lib/userService';
import type { RegisterBodyType, LoginBodyType } from './auth.schema';
import type { AuthResponse } from '@coterapeuta/shared';

// Thin delegates so the existing API surface (and 23 property tests that
// import these functions directly) keep working unchanged.
export const register = (body: RegisterBodyType): Promise<AuthResponse> => userService.register(body);
export const login = (body: LoginBodyType): Promise<AuthResponse> => userService.login(body);
