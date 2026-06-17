import { z } from 'zod';

export const AssignmentBody = z.object({
  techniqueId: z.string().uuid(),
  patientId: z.string().uuid(),
  therapistNotes: z.string().optional(),
});

export type AssignmentBodyType = z.infer<typeof AssignmentBody>;
