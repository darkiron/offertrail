import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Checkbox,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';
import classes from './Pricing.module.css';

type PlanId = 'free' | 'pro' | 'ultimate';
type Period = 'monthly' | 'yearly';

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, ultimate: 2 };

type PlanDef = {
  id: PlanId;
  name: string;
  prices: Partial<Record<Period, { amount: string; suffix: string; note?: string }>>;
  specs: Array<{ label: string; value: string }>;
  badgeMonthly?: { label: string; violet?: boolean };
  badgeYearly?: { label: string; violet?: boolean };
};

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    prices: {
      monthly: { amount: '0€', suffix: '', note: 'Gratuit, sans CB' },
    },
    specs: [
      { label: 'Mensuel', value: '0€' },
      { label: 'Annuel', value: '—' },
      { label: 'Candidatures', value: '5' },
      { label: 'Historique', value: '1 mois' },
      { label: 'Relances', value: '1 active' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    prices: {
      monthly: { amount: '9,99€', suffix: '/mois', note: 'Facturation mensuelle, sans engagement' },
      yearly:  { amount: '99€',   suffix: '/an',   note: 'Soit 8,25€/mois — économise 17%' },
    },
    specs: [
      { label: 'Mensuel', value: '9,99€' },
      { label: 'Annuel', value: '99€/an' },
      { label: 'Candidatures', value: '100' },
      { label: 'Historique', value: '6 mois' },
      { label: 'Relances', value: '10 actives' },
    ],
    badgeMonthly: { label: 'Populaire' },
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    prices: {
      monthly: { amount: '14,99€', suffix: '/mois', note: 'Facturation mensuelle' },
      yearly:  { amount: '149€',   suffix: '/an',   note: 'Soit 12,42€/mois — économise 17%' },
    },
    specs: [
      { label: 'Mensuel', value: '14,99€' },
      { label: 'Annuel', value: '149€/an' },
      { label: 'Candidatures', value: 'Illimité' },
      { label: 'Historique', value: 'Illimité' },
      { label: 'Relances', value: 'Illimitées' },
    ],
    badgeYearly: { label: 'Meilleur rapport', violet: true },
  },
];

export function Pricing() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    document.title = 'Tarifs — OfferTrail';
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, []);

  const currentPlan = useMemo<PlanId>(() => {
    if (sub?.plan === 'pro' || sub?.plan === 'ultimate') {
      return sub.plan;
    }
    return 'free';
  }, [sub]);

  const handleCheckout = async (plan: Exclude<PlanId, 'free'>) => {
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
      notifications.show({ message: 'Plan activé.', color: 'green' });
    } catch {
      notifications.show({ message: "Impossible d'initialiser le paiement.", color: 'red' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderAction = (plan: PlanId) => {
    if (plan === currentPlan) {
      return <Button variant="secondary" disabled fullWidth>Plan actuel</Button>;
    }
    if (plan === 'free') {
      return <Button variant="secondary" disabled fullWidth>Downgrade</Button>;
    }
    if (PLAN_RANK[plan] < PLAN_RANK[currentPlan]) {
      return <Button variant="secondary" disabled fullWidth>Downgrade</Button>;
    }

    return (
      <Button
        variant="primary"
        onClick={() => void handleCheckout(plan)}
        disabled={!cgvAccepted || loadingPlan !== null}
        loading={loadingPlan === plan}
        fullWidth
      >
        {loadingPlan === plan ? 'Redirection...' : 'Essai gratuit 30 jours'}
      </Button>
    );
  };

  return (
    <Stack gap="lg" className={classes.shell}>
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <p className={classes.kicker}>Tarifs</p>
          <h1 className={classes.title}>Choisis le plan adapté à ton volume de candidatures</h1>
          <p className={classes.subtitle}>
            Trois plans lisibles, premier mois offert sur Pro et Ultimate, promotions gérées par coupons Stripe.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>Retour</Button>
      </div>

      <div className={classes.controlsRow}>
        <span className={classes.controlsLabel}>Périodicité</span>
        <SegmentedControl
          data={[
            { label: 'Mensuel', value: 'monthly' },
            { label: 'Annuel',  value: 'yearly'  },
          ]}
          value={period}
          onChange={(value) => setPeriod(value as Period)}
        />
        {period === 'yearly' && <span className={classes.savingsBadge}>-17%</span>}

        <div className={classes.promoWrap}>
          <span className={classes.controlsLabel}>Code promo</span>
          <TextInput
            placeholder="LAUNCH2026"
            value={promoCode}
            onChange={(event) => setPromoCode(event.currentTarget.value.toUpperCase())}
            size="sm"
          />
        </div>
      </div>

      <div className={classes.grid}>
        {PLANS.map((plan) => {
          const priceData = plan.prices[plan.id === 'free' ? 'monthly' : period];
          if (!priceData) return null;

          const badge = period === 'monthly' ? plan.badgeMonthly : plan.badgeYearly;
          const featured = !!badge;

          return (
            <div
              key={plan.id}
              className={`${classes.card} ${featured ? classes.cardFeatured : ''}`}
            >
              {badge && (
                <span
                  className={`${classes.featuredBadge} ${badge.violet ? classes.featuredBadgeViolet : ''}`}
                >
                  {badge.label}
                </span>
              )}

              <p className={classes.planName}>{plan.name}</p>
              <div className={classes.priceRow}>
                <h2 className={classes.price}>{priceData.amount}</h2>
                {priceData.suffix && <span className={classes.pricePeriod}>{priceData.suffix}</span>}
              </div>
              <p className={classes.priceNote}>{priceData.note || ''}</p>

              {plan.id !== 'free' && (
                <span className={classes.trialPill}>Premier mois offert</span>
              )}

              <div className={classes.specList}>
                {plan.specs.map((spec) => (
                  <div key={spec.label} className={classes.specItem}>
                    <span>{spec.label}</span>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>

              <div className={classes.cardFooter}>
                {plan.id !== 'free' && (
                  <Checkbox
                    className={classes.cgvCheckbox}
                    label={(
                      <span>
                        J&apos;accepte les <a href="/app/legal/cgv" target="_blank" rel="noreferrer">CGV</a> et renonce
                        au droit de rétractation (article L221-28 du Code de la consommation), le service étant accessible immédiatement.
                      </span>
                    )}
                    checked={cgvAccepted}
                    onChange={(event) => setCgvAccepted(event.currentTarget.checked)}
                    required
                  />
                )}
                {renderAction(plan.id)}
              </div>
            </div>
          );
        })}
      </div>

      <section className={classes.transparency}>
        <div className={classes.transparencyHeader}>
          <div>
            <p className={classes.kicker}>Transparence prix</p>
            <h3 className={classes.transparencyTitle}>Ce que finance l&apos;abonnement</h3>
          </div>
          <Group gap="xs">
            <span className={classes.savingsBadge}>CraftCodes</span>
          </Group>
        </div>
        <div className={classes.transparencyGrid}>
          {[
            ['URSSAF et charges', 'Cotisations, taxes et cadre administratif du service.'],
            ['Stripe',            'Paiement sécurisé, facturation et gestion des abonnements.'],
            ['Produit',           'Développement, hébergement, maintenance et support CraftCodes.'],
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
