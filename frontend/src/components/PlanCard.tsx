import { Button } from './atoms/Button';
import { useI18n } from '../i18n';
import type { BillingPeriod, PlanId, PricingPlan } from '../lib/pricingPlans';
import classes from './PlanCard.module.css';

interface Props {
  plan: PricingPlan;
  isSelected?: boolean;
  isCurrent?: boolean;
  loading?: boolean;
  period: BillingPeriod;
  checkoutDisabled?: boolean;
  appCtaLabel?: string;
  onSelect: (id: PlanId) => void;
  onCta: (id: PlanId, period: BillingPeriod) => void;
  mode: 'app' | 'public';
}

export function PlanCard({
  plan,
  isSelected = false,
  isCurrent = false,
  loading = false,
  period,
  checkoutDisabled = false,
  appCtaLabel,
  onSelect,
  onCta,
  mode,
}: Props) {
  const { t } = useI18n();

  const hasYearly = !!plan.prices.yearly;
  const activePeriod = hasYearly ? period : 'monthly';
  const currentPrice =
    activePeriod === 'yearly' && plan.prices.yearly
      ? plan.prices.yearly
      : plan.prices.monthly;
  const badge =
    activePeriod === 'yearly' ? plan.badgeYearly : plan.badgeMonthly;

  const handleCardClick = () => {
    onSelect(plan.id);
  };

  const handleCtaClick = () => {
    onCta(plan.id, activePeriod);
  };

  return (
    <div
      className={`${classes.card} ${isSelected ? classes.selected : ''} ${isCurrent ? classes.current : ''}`}
      onClick={handleCardClick}
    >
      {badge && (
        <div
          className={`${classes.badge} ${badge.violet ? classes.violet : ''}`}
        >
          {badge.label}
        </div>
      )}
      <div className={classes.planName}>{plan.name}</div>
      <div className={classes.priceRow}>
        <div className={classes.price}>{currentPrice.amount}</div>
        <div className={classes.suffix}>{currentPrice.suffix}</div>
      </div>
      <div className={classes.note}>{currentPrice.note}</div>
      {plan.id !== 'free' && (
        <div className={classes.trialPill}>
          {t('landing.pricing.trialPill')}
        </div>
      )}
      <ul className={classes.featureList}>
        {plan.features.map((feature) => (
          <li key={feature} className={classes.featureItem}>
            <span className={classes.featureCheck}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <ul className={classes.specList}>
        {plan.specs.map((spec, index) => (
          <li key={index} className={classes.specItem}>
            <span>{spec.label}</span>
            <strong>{spec.value}</strong>
          </li>
        ))}
      </ul>
      <div className={classes.footer}>
        {isCurrent ? (
          <Button variant="ghost" size="small" disabled>
            {t('landing.pricing.currentPlan')}
          </Button>
        ) : mode === 'public' ? (
          <Button
            variant={plan.id === 'free' ? 'ghost' : 'primary'}
            size="small"
            onClick={handleCtaClick}
          >
            {plan.id === 'free'
              ? t('landing.pricing.freeCta')
              : t('landing.pricing.trialCta')}
          </Button>
        ) : plan.id === 'free' ? (
          <Button variant="ghost" size="small" disabled>
            {t('landing.pricing.downgrade')}
          </Button>
        ) : (
          <div className={classes.ctaGroup}>
            <Button
              variant="primary"
              size="small"
              onClick={handleCtaClick}
              disabled={checkoutDisabled || loading}
              loading={loading}
            >
              {loading
                ? t('landing.pricing.redirecting')
                : (appCtaLabel ?? t('landing.pricing.trialCta'))}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
