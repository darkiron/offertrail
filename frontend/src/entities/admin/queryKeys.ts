export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  mrrHistory: () => [...adminKeys.all, 'mrr-history'] as const,
  signups: () => [...adminKeys.all, 'signups'] as const,
  planDistribution: () => [...adminKeys.all, 'plan-distribution'] as const,
  candidaturesDaily: () => [...adminKeys.all, 'candidatures-daily'] as const,
  promos: () => [...adminKeys.all, 'promos'] as const,
};
