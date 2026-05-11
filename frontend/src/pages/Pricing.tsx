import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Group,
  Stack,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';
import { PlanCard } from '../components/PlanCard';
import { useI18n } from '../i18n';
import classes from './Pricing.module.css';

type PlanId = 'free' | 'pro' | 'ultimate';
type Period = 'monthly' | 'yearly';

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, ultimate: 2 };

export function Pricing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    document.title = t('landing.pricing.pageTitle');
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, [t]);

  const currentPlan = useMemo<PlanId>(() => {
    if (sub?.plan === 'pro' || sub?.plan === 'ultimate') {
      return sub.plan;
    }
    return 'free';
  }, [sub]);

  type PlanDef = {
    id: PlanId;
    name: string;
    prices: Partial<Record<Period, { amount: string; suffix: string; note: string }>>;
    specs: Array<{ label: string; value: string }>;
    badgeMonthly?: { label: string; violet?: boolean };
    badgeYearly?: { label: string; violet?: boolean };
  };

  const PLANS: PlanDef[] = useMemo(() => [
    {
      id: 'free',
      name: t('landing.pricing.freeName'),
      prices: {
        monthly: { amount: '0€', suffix: '', note: t('landing.pricing.freeNote') },
      },
      specs: [
        { label: t('landing.pricing.specApplications'), value: '5' },
        { label: t('landing.pricing.specHistory'),      value: '1 mois' },
        { label: t('landing.pricing.specFollowups'),    value: '1' },
      ],
    },
    {
      id: 'pro',
      name: t('landing.pricing.proName'),
      prices: {
        monthly: { amount: '9,99€', suffix: '/mois', note: t('landing.pricing.proMonthlyNote') },
        yearly:  { amount: '99€',   suffix: '/an',   note: t('landing.pricing.proYearlyNote') },
      },
      specs: [
        { label: t('landing.pricing.specApplications'), value: '100' },
        { label: t('landing.pricing.specHistory'),      value: '6 mois' },
        { label: t('landing.pricing.specFollowups'),    value: '10' },
      ],
      badgeMonthly: { label: t('landing.pricing.badgePopular') },
    },
    {
      id: 'ultimate',
      name: t('landing.pricing.ultimateName'),
      prices: {
        monthly: { amount: '14,99€', suffix: '/mois', note: t('landing.pricing.ultimateMonthlyNote') },
        yearly:  { amount: '149€',   suffix: '/an',   note: t('landing.pricing.ultimateYearlyNote') },
      },
      specs: [
        { label: t('landing.pricing.specApplications'), value: '∞' },
        { label: t('landing.pricing.specHistory'),      value: '∞' },
        { label: t('landing.pricing.specFollowups'),    value: '∞' },
      ],
      badgeYearly: { label: t('landing.pricing.badgeBestValue'), violet: true },
    },
  ], [t]);

  const handleCheckout = async (plan: Exclude<PlanId, 'free'>, period: Period) => {
    setLoadingPlan(plan);
    try {
      const checkout = await subscriptionService.checkout({
        plan,
        period,
        coupon: promoCode.trim() || undefined,
      });

      if (checkout.mode === 'stripe' && checkout.checkout_url) {
        window.location.assign(checkout.checkout_url);
        return;
      }

      const updated = await subscriptionService.getMe();
      setSub(updated);
      notifications.show({ message: t('monCompte.proActivated'), color: 'green' });
    } catch {
      notifications.show({ message: t('monCompte.proActivateError'), color: 'red' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCta = (id: PlanId, period: Period) => {
    if (id === 'free' || PLAN_RANK[id] < PLAN_RANK[currentPlan]) return;
    void handleCheckout(id as Exclude<PlanId, 'free'>, period);
  };

  return (
    <Stack gap="lg" className={classes.shell}>
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <p className={classes.kicker}>{t('landing.pricing.pageKicker')}</p>
          <h1 className={classes.title}>{t('landing.pricing.pageTitle2')}</h1>
          <p className={classes.subtitle}>{t('landing.pricing.pageSubtitle')}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>{t('landing.pricing.back')}</Button>
      </div>

      <div className={classes.controlsRow}>
        <span className={classes.controlsLabel}>{t('landing.pricing.promoLabel')}</span>
        <TextInput
          placeholder="LAUNCH2026"
          value={promoCode}
          onChange={(event) => setPromoCode(event.currentTarget.value.toUpperCase())}
          size="sm"
        />
      </div>

      <div className={classes.grid}>
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            isCurrent={currentPlan === plan.id}
            onSelect={setSelectedPlan}
            onCta={handleCta}
            mode="app"
            loading={loadingPlan === plan.id}
          />
        ))}
      </div>

      <section className={classes.transparency}>
        <div className={classes.transparencyHeader}>
          <div>
            <p className={classes.kicker}>{t('landing.pricing.transparencyKicker')}</p>
            <h3 className={classes.transparencyTitle}>{t('landing.pricing.transparencyTitle')}</h3>
          </div>
          <Group gap="xs">
            <span className={classes.savingsBadge}>CraftCodes</span>
          </Group>
        </div>
        <div className={classes.transparencyGrid}>
          {[
            [t('landing.pricing.transparencyItem1Title'), t('landing.pricing.transparencyItem1Desc')],
            [t('landing.pricing.transparencyItem2Title'), t('landing.pricing.transparencyItem2Desc')],
            [t('landing.pricing.transparencyItem3Title'), t('landing.pricing.transparencyItem3Desc')],
          ].map(([title, description]) => (
            <div key={title} className={classes.transparencyItem}>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </Stack>
  );
}

export default Pricing;
