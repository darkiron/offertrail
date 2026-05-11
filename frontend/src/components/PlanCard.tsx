import { useState } from 'react';
import { Switch, Checkbox, Button, Anchor } from '@mantine/core';
import { useI18n } from '../i18n';
import type { BillingPeriod, PlanId, PricingPlan } from '../lib/pricingPlans';
import classes from './PlanCard.module.css';

interface Props {
  plan: PricingPlan;
  isSelected?: boolean;
  isCurrent?: boolean;
  loading?: boolean;
  onSelect: (id: PlanId) => void;
  onCta: (id: PlanId, period: BillingPeriod) => void;
  mode: 'app' | 'public';
}

export function PlanCard({ plan, isSelected = false, isCurrent = false, loading = false, onSelect, onCta, mode }: Props) {
  const { t } = useI18n();
  const [isYearly, setIsYearly] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);

  const hasYearly = !!plan.prices.yearly;
  const currentPrice = hasYearly && isYearly ? plan.prices.yearly : plan.prices.monthly;
  const badge = hasYearly && isYearly ? plan.badgeYearly : plan.badgeMonthly;

  const handleCardClick = () => {
    onSelect(plan.id);
  };

  const handleCtaClick = () => {
    const period: BillingPeriod = isYearly ? 'yearly' : 'monthly';
    onCta(plan.id, period);
  };

  return (
    <div 
      className={`${classes.card} ${isSelected ? classes.selected : ''} ${isCurrent ? classes.current : ''}`} 
      onClick={handleCardClick}
    >
      {badge && (
        <div className={`${classes.badge} ${badge.violet ? classes.violet : ''}`}>
          {badge.label}
        </div>
      )}
      <div className={classes.planName}>{plan.name}</div>
      <div className={classes.priceRow}>
        <div className={classes.price}>{currentPrice.amount}</div>
        <div className={classes.suffix}>{currentPrice.suffix}</div>
      </div>
      <div className={classes.note}>{currentPrice.note}</div>
      {hasYearly && (
        <Switch
          checked={isYearly}
          onChange={(event) => setIsYearly(event.currentTarget.checked)}
          label={t('landing.pricing.yearly')}
          size="sm"
          classNames={{ label: classes.switchLabel }}
        />
      )}
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
          <Button variant="light" disabled>
            {t('landing.pricing.currentPlan')}
          </Button>
        ) : mode === 'public' ? (
          <Button variant={plan.id === 'free' ? 'light' : 'filled'} onClick={handleCtaClick}>
            {plan.id === 'free' ? t('landing.pricing.freeCta') : t('landing.pricing.trialCta')}
          </Button>
        ) : plan.id === 'free' ? (
          <Button variant="light" disabled>
            {t('landing.pricing.downgrade')}
          </Button>
        ) : (
          <div className={classes.ctaGroup}>
            <Checkbox
              label={
                <span>
                  {t('landing.pricing.cgvLabel')} <Anchor href="/app/legal/cgv" target="_blank" rel="noreferrer">{t('landing.pricing.cgvLink')}</Anchor> {t('landing.pricing.cgvSuffix')}
                </span>
              }
              checked={cgvAccepted}
              onChange={(event) => setCgvAccepted(event.currentTarget.checked)}
              size="sm"
              className={classes.cgvCheckbox}
            />
            <Button 
              variant="filled" 
              onClick={handleCtaClick}
              disabled={!cgvAccepted || loading}
              loading={loading}
            >
              {loading ? t('landing.pricing.redirecting') : t('landing.pricing.trialCta')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
