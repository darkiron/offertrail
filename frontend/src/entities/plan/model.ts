import { z } from 'zod';

export const subscriptionStatusSchema = z.object({
  subscription_status: z.string(),
  is_active: z.boolean(),
  plan: z.string(),
  billing_period: z.enum(['monthly', 'yearly']).nullable(),
  plan_started_at: z.string().nullable(),
  limits: z.record(z.string(), z.unknown()).optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
});

export const checkoutResponseSchema = z.object({
  mode: z.enum(['simulated', 'stripe']),
  checkout_url: z.string().nullable(),
  message: z.string().optional(),
});

export const portalResponseSchema = z.object({
  portal_url: z.string(),
});

export interface CheckoutPayload {
  plan: 'pro' | 'ultimate';
  period: 'monthly' | 'yearly';
  coupon?: string;
}
