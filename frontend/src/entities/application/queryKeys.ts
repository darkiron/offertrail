import type { WorkflowApplicationListParams } from './model';

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (params: WorkflowApplicationListParams) =>
    [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  today: () => [...applicationKeys.all, 'today'] as const,
};
