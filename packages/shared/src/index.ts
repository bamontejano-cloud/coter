/**
 * Shared types and constants for the Coterapeuta platform.
 *
 * Source-of-truth DTOs that the API emits and the web consumes.
 * Both apps/api and apps/web compile against this package
 * (see `references` in their tsconfigs).
 *
 * Nullable fields are typed as `T | null` to mirror what the API
 * serialises (Prisma's raw shape); consumers can use truthy checks.
 */

// ---------- Roles & status enums ----------

export type Role = 'therapist' | 'patient';
export const ROLES: readonly Role[] = ['therapist', 'patient'] as const;
/** Mutable literal tuple for libraries (e.g. Zod) that require a fixed-width tuple. */
export const ROLE_TUPLE: ['therapist', 'patient'] = ['therapist', 'patient'];

export type AssignmentStatus = 'pending' | 'completed';
export const ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
  'pending',
  'completed',
] as const;

export type NotificationType = 'assignment_completed';

// ---------- Auth ----------

/** Public-facing user shape returned by /auth/register and /auth/login. */
export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

// ---------- Patients ----------

/** Row in GET /patients list. */
export interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  linkedAt: string; // ISO timestamp
}

/** Response body of GET /patients/:id. */
export interface PatientProfile {
  id: string;
  fullName: string;
  email: string;
  linkedAt: string;
  assignments: AssignmentSummary[];
  messagesSummary: { unreadCount: number };
}

// ---------- Techniques ----------

/** Row as returned by GET /techniques and friends. */
export interface Technique {
  id: string;
  therapistId: string;
  title: string;
  description: string;
  category: string;
  patientInstructions: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Assignments ----------

/** Shape returned by the API for any assignment listing. */
export interface Assignment {
  id: string;
  techniqueId: string;
  therapistId: string;
  patientId: string;
  status: AssignmentStatus;
  therapistNotes: string | null;
  assignedAt: string;
  /** Present when the service included `technique: { select: { title: true } }`. */
  technique?: { title: string };
}

/** Subset used inside PatientProfile.assignments — flat title. */
export interface AssignmentSummary {
  id: string;
  techniqueId: string;
  techniqueTitle: string;
  status: AssignmentStatus;
  assignedAt: string;
  therapistNotes: string | null;
}

// ---------- Records ----------

export interface RecordEntry {
  id: string;
  assignmentId: string;
  patientId: string;
  response: string;
  submittedAt: string;
}

// ---------- Conversations + messages ----------

export interface Conversation {
  id: string;
  therapistId: string;
  patientId: string;
  createdAt: string;
}

/** Row in GET /messages/conversations. */
export interface ConversationSummary {
  conversationId: string;
  participantId: string;
  unreadCount: number;
  lastMessage?: { content: string; sentAt: string };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  sentAt: string;
}

// ---------- Invitations ----------

export interface Invitation {
  id: string;
  code: string;
  therapistId: string;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationCreateResponse {
  code: string;
  expiresAt: string;
}

// ---------- Notifications ----------

export interface Notification {
  id: string;
  type: NotificationType;
  therapistId: string;
  patientId: string;
  assignmentId: string;
  read: boolean;
  createdAt: string;
}

// ---------- Error codes ----------

export const ErrorCodes = {
  UNAUTHORIZED: 'unauthorized',
  INVALID_CREDENTIALS: 'invalid_credentials',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
  INVALID_INVITATION: 'invalid_invitation',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  INTERNAL_ERROR: 'internal_error',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
