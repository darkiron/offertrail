import { z } from 'zod';

const nullableText = z.string().nullable();
const contactSchema = z.object({
  id: z.string(),
  organization_id: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  email: nullableText,
  phone: nullableText,
  role: nullableText,
  is_recruiter: z.number(),
  linkedin_url: nullableText,
  notes: nullableText,
  created_at: z.string(),
  updated_at: z.string(),
});

export const contactPortfolioSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      role: nullableText,
      email: nullableText,
      phone: nullableText,
      is_recruiter: z.boolean(),
      updated_at: z.string(),
      organization: z
        .object({ id: z.string(), name: z.string(), type: z.string() })
        .nullable(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
});

export const contactDetailsSchema = contactSchema.extend({
  organization: z
    .object({ id: z.string(), name: z.string(), type: z.string() })
    .nullable(),
  applications: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      company: z.string().optional(),
      applied_at: z.string().nullable(),
      status: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      ts: z.string(),
      type: z.string(),
      event_type: z.string().optional(),
      payload: z.record(z.string(), z.unknown()).optional(),
      application: z
        .object({
          id: z.union([z.string(), z.number()]),
          title: z.string(),
          status: z.string(),
        })
        .optional(),
    }),
  ),
});
