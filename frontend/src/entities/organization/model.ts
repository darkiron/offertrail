import { z } from 'zod';

const organizationPortfolioItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  type_contrat: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  applications_count: z.number(),
  responses_count: z.number(),
  positive_count: z.number(),
  response_rate: z.number(),
});

export const organizationPortfolioSchema = z.object({
  items: z.array(organizationPortfolioItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
});

export const organizationWorkspaceSchema = z.object({
  organization: organizationPortfolioItemSchema,
  applications: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      applied_at: z.string().nullable(),
      updated_at: z.string(),
      source: z.string().nullable(),
    }),
  ),
  contacts: z.array(
    z.object({
      id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      role: z.string().nullable(),
      email: z.string().nullable(),
      linkedin_url: z.string().nullable(),
    }),
  ),
  activity: z.array(
    z.object({
      id: z.string(),
      application_id: z.string(),
      type: z.string(),
      content: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
  capabilities: z.object({ can_edit: z.boolean() }),
});
