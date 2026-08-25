import { z } from 'zod';

const nullableString = z.string().nullable();

export const adminStatsSchema = z.object({
  total_users: z.number(),
  free_users: z.number(),
  pro_users: z.number(),
  ultimate_users: z.number(),
  mrr: z.number(),
  arr: z.number(),
  new_users_7d: z.number(),
  new_users_30d: z.number(),
  conversion_rate: z.number(),
  total_candidatures: z.number(),
  total_relances: z.number(),
  total_etablissements: z.number(),
  avg_cands_per_user: z.number(),
});

const adminUserRowSchema = z.object({
  id: z.string(),
  email: nullableString,
  prenom: nullableString,
  nom: nullableString,
  plan: z.string(),
  billing_period: z.enum(['monthly', 'yearly']).nullable(),
  role: z.string(),
  is_active: z.boolean(),
  nb_candidatures: z.number(),
  created_at: nullableString,
});

const mrrPointSchema = z.object({
  month: z.string(),
  mrr: z.number(),
  active_users: z.number(),
});

const signupPointSchema = z.object({
  date: z.string(),
  signups: z.number(),
  upgrades: z.number(),
});

const planPointSchema = z.object({
  name: z.string(),
  plan: z.enum(['free', 'pro', 'ultimate']),
  value: z.number(),
});

const candPointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const promoRowSchema = z.object({
  id: z.string(),
  name: nullableString,
  percent_off: z.number().nullable(),
  amount_off: z.number().nullable(),
  duration: z.string(),
  times_redeemed: z.number(),
  valid: z.boolean(),
});

export const adminPromosResponseSchema = z.object({
  promos: z.array(promoRowSchema),
});

export const adminUsersResponseSchema = z.array(adminUserRowSchema);
export const adminMrrHistorySchema = z.array(mrrPointSchema);
export const adminSignupsSchema = z.array(signupPointSchema);
export const adminPlanDistributionSchema = z.array(planPointSchema);
export const adminCandidaturesDailySchema = z.array(candPointSchema);

export type AdminStats = z.infer<typeof adminStatsSchema>;
export type AdminUserRow = z.infer<typeof adminUserRowSchema>;
export type MrrPoint = z.infer<typeof mrrPointSchema>;
export type SignupPoint = z.infer<typeof signupPointSchema>;
export type PlanPoint = z.infer<typeof planPointSchema>;
export type CandPoint = z.infer<typeof candPointSchema>;
export type PromoRow = z.infer<typeof promoRowSchema>;

export type AdminUserPlanUpdate = {
  plan: 'free' | 'pro' | 'ultimate';
  billing_period: 'monthly' | 'yearly' | null;
};
