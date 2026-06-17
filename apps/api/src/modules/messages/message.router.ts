import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validateBody';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { MessageBody } from './message.schema';
import { listConversations, getMessages, sendMessage } from './message.service';

export const messageRouter = Router();

messageRouter.get(
  '/conversations',
  authenticate,
  ah(async (req, res) => {
    const user = currentUser(req);
    const conversations = await listConversations(user.sub, user.role);
    res.json(conversations);
  }),
);

messageRouter.get(
  '/:conversationId',
  authenticate,
  ah(async (req, res) => {
    const messages = await getMessages(currentUser(req).sub, req.params.conversationId);
    res.json(messages);
  }),
);

messageRouter.post(
  '/',
  authenticate,
  validateBody(MessageBody),
  ah(async (req, res) => {
    const message = await sendMessage(currentUser(req).sub, req.body);
    res.status(201).json(message);
  }),
);
