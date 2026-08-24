export const planKeys = {
  all: ['plan'] as const,
  subscriptionStatus: () => [...planKeys.all, 'subscription-status'] as const,
};
