import { z } from 'zod';

export const TechniqueBody = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1),
  category: z.string().min(1),
  patientInstructions: z.string().optional(),
});

export type TechniqueBodyType = z.infer<typeof TechniqueBody>;
