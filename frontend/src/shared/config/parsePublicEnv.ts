import { z } from 'zod';

const publicEnvSchema = z.object({
  VITE_API_URL: z.union([z.literal(''), z.url()]).default(''),
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_CONTACT_EMAIL: z.email().default('contact@offertrail.fr'),
  VITE_CRAFTCODES_URL: z.url().default('https://craftcodes.fr'),
  VITE_STRIPE_PK: z.string().optional(),
  VITE_PROMO_PLACEHOLDER: z.string().optional(),
});

export type PublicEnvSource = Record<string, string | boolean | undefined>;

export function parsePublicEnv(source: PublicEnvSource) {
  const result = publicEnvSchema.safeParse(source);
  if (!result.success) {
    const variables = result.error.issues
      .map((issue) => issue.path.join('.'))
      .filter(Boolean)
      .join(', ');
    throw new Error(`Invalid public environment configuration: ${variables}`);
  }

  return {
    apiUrl: result.data.VITE_API_URL,
    supabaseUrl: result.data.VITE_SUPABASE_URL,
    supabaseAnonKey: result.data.VITE_SUPABASE_ANON_KEY,
    contactEmail: result.data.VITE_CONTACT_EMAIL,
    craftcodesUrl: result.data.VITE_CRAFTCODES_URL,
    stripePublishableKey: result.data.VITE_STRIPE_PK,
    promoPlaceholder: result.data.VITE_PROMO_PLACEHOLDER,
  } as const;
}
