import type { SubscriptionStatus } from '../types';

interface PlanLimitBannerProps {
  sub: SubscriptionStatus | null;
}

export function PlanLimitBanner({ sub }: PlanLimitBannerProps) {
  if (!sub || sub.is_active) return null;
  return null;
}
