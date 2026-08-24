import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanCard } from '../../PlanCard';
import { useI18n } from '../../../i18n';
import { usePricingPlans } from '../../../lib/pricingPlans';
import type { BillingPeriod, PlanId } from '../../../lib/pricingPlans';
import classes from './LandingPricing.module.scss';

export function LandingPricing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const plans = usePricingPlans();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const handleCta = (plan: PlanId, billingPeriod: BillingPeriod) =>
    navigate(
      `/register?${new URLSearchParams({ plan, period: billingPeriod })}`,
    );
  return (
    <section
      className={classes.section}
      id="tarifs"
      aria-labelledby="pricing-title"
    >
      <div className={classes.heading}>
        <div>
          <p>{t('landing.pricing.pageKicker')}</p>
          <h2 id="pricing-title">{t('landing.pricing.landingTitle')}</h2>
        </div>
        <div>
          <span>{t('landing.pricing.landingSub')}</span>
          <div
            className={classes.period}
            role="group"
            aria-label={t('landing.pricing.periodLabel')}
          >
            {(['monthly', 'yearly'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
              >
                {t(`landing.pricing.${value}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={classes.plans}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isSelected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
            onCta={handleCta}
            mode="public"
          />
        ))}
      </div>
    </section>
  );
}
