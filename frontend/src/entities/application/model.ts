import { z } from 'zod';

const nullableString = z.string().nullable();

const workflowApplicationSchema = z.object({
  id: z.string(),
  poste: z.string(),
  statut: z.string(),
  date_candidature: nullableString,
  updated_at: z.string(),
  organization: z.object({ id: z.string(), name: z.string() }),
  next_action: z
    .object({
      id: z.string(),
      kind: z.string(),
      due_at: z.string(),
      urgency: z.string(),
    })
    .nullable(),
  last_event: z
    .object({ kind: z.string(), occurred_at: z.string() })
    .nullable(),
});

export const workflowApplicationPageSchema = z.object({
  items: z.array(workflowApplicationSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});

export const applicationWorkspaceSchema = z.object({
  application: z.object({
    id: z.string(),
    etablissement_id: z.string(),
    client_final_id: nullableString,
    poste: z.string(),
    statut: z.string(),
    url_offre: nullableString,
    description: nullableString,
    type_contrat: nullableString,
    notes: nullableString,
    source: nullableString,
    date_candidature: nullableString,
    salaire_vise: z.number().nullable(),
    tjm_vise: z.number().nullable(),
  }),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    website: nullableString,
    description: nullableString,
    relationship_summary: z.object({
      applications: z.number(),
      responses: z.number(),
    }),
  }),
  final_customer: z.object({ id: z.string(), name: z.string() }).nullable(),
  contacts: z.array(
    z.object({
      id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      role: nullableString,
      email: nullableString,
      linkedin_url: nullableString,
    }),
  ),
  next_action: z
    .object({
      id: z.string(),
      kind: z.string(),
      due_at: z.string(),
      channel: nullableString,
    })
    .nullable(),
  future_actions: z.array(
    z.object({ id: z.string(), due_at: z.string(), channel: nullableString }),
  ),
  timeline: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        ancien_statut: nullableString,
        nouveau_statut: nullableString,
        contenu: nullableString,
        created_at: z.string(),
      }),
    ),
    next_cursor: nullableString,
  }),
  capabilities: z.object({
    can_update: z.boolean(),
    can_delete: z.boolean(),
    can_create_followup: z.boolean(),
  }),
});

const todayActionSchema = z.object({
  id: z.string(),
  kind: z.literal('followup'),
  due_at: z.string(),
  urgency: z.enum(['overdue', 'today', 'upcoming']),
  application: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  organization: z.object({ id: z.string(), name: z.string() }),
  contact: z
    .object({ id: z.string(), display_name: z.string(), role: nullableString })
    .nullable(),
  context: z
    .object({
      last_event_label: z.string().optional(),
      last_event_at: z.string().optional(),
    })
    .nullable(),
});

export const todayDataSchema = z.object({
  generated_at: z.string(),
  timezone: z.string(),
  activation: z.object({
    state: z.enum(['active', 'onboarding']),
    first_application_created: z.boolean(),
    first_next_action_scheduled: z.boolean(),
  }),
  actions: z.object({
    due_count: z.number().int().nonnegative(),
    items: z.array(todayActionSchema),
    next_due_at: nullableString,
  }),
  summary: z.object({
    active_applications: z.number().int().nonnegative(),
    responses_30d: z.number().int().nonnegative(),
    interviews_30d: z.number().int().nonnegative(),
  }),
  recent_activity: z.array(z.record(z.string(), z.unknown())),
});

export type WorkflowApplicationListParams = {
  q?: string;
  status?: string;
  due?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  include_closed?: boolean;
};
export type TodayAction = z.infer<typeof todayActionSchema>;
