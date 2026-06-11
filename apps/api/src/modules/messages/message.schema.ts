import { z } from 'zod';

export const MessageBody = z.object({
  conversationId: z.string().uuid(),
  content: z.string().refine((s) => s.trim().length > 0, {
    message: 'El mensaje no puede estar vacío',
  }),
});

export type MessageBodyType = z.infer<typeof MessageBody>;
