import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './lib/errorHandler';
import { authRouter } from './modules/auth/auth.router';
import { invitationRouter } from './modules/invitations/invitation.router';
import { patientRouter } from './modules/patients/patient.router';
import { techniqueRouter } from './modules/techniques/technique.router';
import { assignmentRouter } from './modules/assignments/assignment.router';
import { recordRouter } from './modules/records/record.router';
import { messageRouter } from './modules/messages/message.router';
import { notificationRouter } from './modules/notifications/notification.router';

export const app = express();

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

// JSON body parser
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/auth', authRouter);

// Invitation routes
app.use('/invitations', invitationRouter);

// Patient routes
app.use('/patients', patientRouter);

// Technique routes
app.use('/techniques', techniqueRouter);

// Assignment routes
app.use('/assignments', assignmentRouter);

// Record routes
app.use('/records', recordRouter);

// Message routes
app.use('/messages', messageRouter);

// Notification routes
app.use('/notifications', notificationRouter);

// Global error handler
app.use(errorHandler);
