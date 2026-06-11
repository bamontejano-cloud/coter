import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { AppError } from '../../lib/errors';
import { MessageBody } from './message.schema';
import { listConversations, getMessages, sendMessage } from './message.service';

export const messageRouter = Router();

messageRouter.get(
  '/conversations',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversations = await listConversations(req.user!.sub, req.user!.role);
      res.json(conversations);
    } catch (err) {
      next(err);
    }
  },
);

messageRouter.get(
  '/:conversationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await getMessages(req.user!.sub, req.params.conversationId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  },
);

messageRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = MessageBody.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
    }
    try {
      const message = await sendMessage(req.user!.sub, parsed.data);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  },
);
