import { z } from 'zod';

export const RecordBody = z.object({
  assignmentId: z.string().uuid(),
  response: z.string().refine((s) => s.trim().length > 0, {
    message: 'El campo de respuesta es obligatorio',
  }),
});

export type RecordBodyType = z.infer<typeof RecordBody>;
