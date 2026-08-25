import { useMemo } from 'react';
import { useI18n } from '../i18n';

export type PlanId = 'free' | 'pro' | 'ultimate';
export type BillingPeriod = 'monthly' | 'yearly';

interface PlanPrice {
  amount: string;
  suffix: string;
  note: string;
}

interface PlanBadge {
  label: string;
  violet?: boolean;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  prices: {
    monthly: PlanPrice;
    yearly?: PlanPrice;
  };
  features: string[];
  specs: Array<{ label: string; value: string }>;
  badgeMonthly?: PlanBadge;
  badgeYearly?: PlanBadge;
}

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  ultimate: 2,
};

export function usePricingPlans(): PricingPlan[] {
  const { t } = useI18n();

  return useMemo(
    () => [
      {
        id: 'free',
        name: t('landing.pricing.freeName'),
        prices: {
          monthly: {
            amount: '0€',
            suffix: '',
            note: t('landing.pricing.freeNote'),
          },
        },
        features: [
          t('landing.pricing.freeFeature1'),
          t('landing.pricing.freeFeature2'),
          t('landing.pricing.freeFeature3'),
        ],
        specs: [
          { label: t('landing.pricing.specApplications'), value: '5' },
          {
            label: t('landing.pricing.specHistory'),
            value: t('landing.pricing.freeHistoryValue'),
          },
          {
            label: t('landing.pricing.specFollowups'),
            value: t('landing.pricing.freeFollowupsValue'),
          },
        ],
      },
      {
        id: 'pro',
        name: t('landing.pricing.proName'),
        prices: {
          monthly: {
            amount: '9,99€',
            suffix: t('landing.pricing.priceSuffixMonth'),
            note: t('landing.pricing.proMonthlyNote'),
          },
          yearly: {
            amount: '99€',
            suffix: t('landing.pricing.priceSuffixYear'),
            note: t('landing.pricing.proYearlyNote'),
          },
        },
        features: [
          t('landing.pricing.proFeature1'),
          t('landing.pricing.proFeature2'),
          t('landing.pricing.proFeature3'),
        ],
        specs: [
          { label: t('landing.pricing.specApplications'), value: '100' },
          {
            label: t('landing.pricing.specHistory'),
            value: t('landing.pricing.proHistoryValue'),
          },
          {
            label: t('landing.pricing.specFollowups'),
            value: t('landing.pricing.proFollowupsValue'),
          },
        ],
        badgeMonthly: { label: t('landing.pricing.badgePopular') },
      },
      {
        id: 'ultimate',
        name: t('landing.pricing.ultimateName'),
        prices: {
          monthly: {
            amount: '14,99€',
            suffix: t('landing.pricing.priceSuffixMonth'),
            note: t('landing.pricing.ultimateMonthlyNote'),
          },
          yearly: {
            amount: '149€',
            suffix: t('landing.pricing.priceSuffixYear'),
            note: t('landing.pricing.ultimateYearlyNote'),
          },
        },
        features: [
          t('landing.pricing.ultimateFeature1'),
          t('landing.pricing.ultimateFeature2'),
          t('landing.pricing.ultimateFeature3'),
        ],
        specs: [
          {
            label: t('landing.pricing.specApplications'),
            value: t('landing.pricing.unlimitedValue'),
          },
          {
            label: t('landing.pricing.specHistory'),
            value: t('landing.pricing.unlimitedValue'),
          },
          {
            label: t('landing.pricing.specFollowups'),
            value: t('landing.pricing.unlimitedValue'),
          },
        ],
        badgeYearly: {
          label: t('landing.pricing.badgeBestValue'),
          violet: true,
        },
      },
    ],
    [t],
  );
}
