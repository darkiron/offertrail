import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  password: z.string().min(8),
});
