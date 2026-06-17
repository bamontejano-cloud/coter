import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';
import { type Role, type AuthResponse, type PublicUser } from '@coterapeuta/shared';
import { prisma as defaultPrisma } from './prisma';
import { signToken, toJwtPayload } from './jwt';
import { Errors } from './errors';
import type { RegisterBodyType, LoginBodyType } from '../modules/auth/auth.schema';
import type { User } from '@prisma/client';

const BCRYPT_COST = 12;

/**
 * Hash + compare functions shaped like `bcrypt.hash` / `bcrypt.compare`.
 * Defined here so tests can inject synchronous/in-memory variants without
 * pulling in the real bcrypt module (which is slow at cost factor 12).
 */
export interface UserServiceDeps {
  db: PrismaClient;
  hash: (data: string, saltOrRounds: number) => Promise<string>;
  compare: (data: string, encrypted: string) => Promise<boolean>;
}

/**
 * `UserService` owns every Prisma + bcrypt interaction for auth.
 * Routers call the exported `register` / `login` functions (which delegate
 * to the default singleton); tests inject custom dependencies to swap the
 * database or the hashing implementation.
 */
export class UserService {
  constructor(private readonly deps: UserServiceDeps) {}

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
    };
  }

  private buildAuthResponse(user: User): AuthResponse {
    return {
      user: this.toPublicUser(user),
      token: signToken(toJwtPayload(user)),
    };
  }

  private async findValidInvitation(code: string) {
    const invite = await this.deps.db.invitation.findUnique({ where: { code } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw Errors.invalidInvitation();
    }
    return invite;
  }

  /** Pre-check: 409 email_already_exists before we burn bcrypt cost-12 hashing. */
  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.deps.db.user.findUnique({ where: { email } });
    if (existing) throw Errors.emailAlreadyExists();
  }

  /** Create the User row + TherapistPatient link + mark invitation used, atomically. */
  async registerWithInvitation(
    body: Omit<RegisterBodyType, 'invitationCode' | 'role'> & { invitationCode: string },
  ): Promise<AuthResponse> {
    await this.assertEmailAvailable(body.email);
    const invite = await this.findValidInvitation(body.invitationCode);
    const passwordHash = await this.deps.hash(body.password, BCRYPT_COST);

    const user = await this.deps.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          passwordHash,
          role: 'patient',
        },
      });
      await tx.therapistPatient.create({
        data: { therapistId: invite.therapistId, patientId: created.id },
      });
      await tx.invitation.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return created;
    });

    return this.buildAuthResponse(user);
  }

  /** Therapist/self-service registration: one Prisma user.create + signing. */
  async registerUser(body: Omit<RegisterBodyType, 'invitationCode'>): Promise<AuthResponse> {
    await this.assertEmailAvailable(body.email);
    const passwordHash = await this.deps.hash(body.password, BCRYPT_COST);
    const user = await this.deps.db.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        passwordHash,
        role: body.role,
      },
    });
    return this.buildAuthResponse(user);
  }

  /** Top-level register: dispatches based on invitation presence. */
  async register(body: RegisterBodyType): Promise<AuthResponse> {
    if (body.invitationCode) {
      return this.registerWithInvitation({ ...body, invitationCode: body.invitationCode });
    }
    return this.registerUser(body);
  }

  /** Find + verify + sign. */
  async login(body: LoginBodyType): Promise<AuthResponse> {
    const user = await this.deps.db.user.findUnique({ where: { email: body.email } });
    if (!user || !(await this.deps.compare(body.password, user.passwordHash))) {
      throw Errors.invalidCredentials();
    }
    return this.buildAuthResponse(user);
  }
}

/** Default singleton bound to the live prisma + bcrypt modules. */
export const userService = new UserService({
  db: defaultPrisma,
  hash: (data, rounds) => bcrypt.hash(data, rounds),
  compare: (data, encrypted) => bcrypt.compare(data, encrypted),
});
