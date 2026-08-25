import { z } from 'zod';

export const profileUpdateSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
});

export const profileSchema = profileUpdateSchema.extend({
  id: z.string(),
  subscription_status: z.string(),
  role: z.string(),
  plan_started_at: z.string().nullable(),
  created_at: z.string().nullable(),
});

export const passwordChangeSchema = z.object({
  password: z.string().min(8),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
