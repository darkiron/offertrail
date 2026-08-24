import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';
import { PlanCard } from '../components/PlanCard';
import { useI18n } from '../i18n';
import { PLAN_RANK, usePricingPlans } from '../lib/pricingPlans';
import { CONFIG } from '../config';
import classes from './Pricing.module.scss';
type PlanId = 'free' | 'pro' | 'ultimate';
type Period = 'monthly' | 'yearly';
export function Pricing() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const plans = usePricingPlans();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionLoadFailed, setSubscriptionLoadFailed] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const requestedPlan = searchParams.get('plan');
  const requestedPeriod = searchParams.get('period');
  const paymentResult = searchParams.get('payment');
  const validPlan = requestedPlan === 'pro' || requestedPlan === 'ultimate';
  const validPeriod =
    requestedPeriod === 'monthly' || requestedPeriod === 'yearly';
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    validPlan ? requestedPlan : 'pro',
  );
  const [period, setPeriod] = useState<Period>(
    validPeriod && requestedPeriod === 'yearly' ? 'yearly' : 'monthly',
  );
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const promoPlaceholder =
    CONFIG.PROMO_PLACEHOLDER || t('landing.pricing.promoPlaceholder');
  const loadSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    setSubscriptionLoadFailed(false);
    setNotice(null);
    try {
      setSub(await subscriptionService.getMe());
    } catch {
      setSub(null);
      setSubscriptionLoadFailed(true);
      setNotice({
        tone: 'error',
        text: t('landing.pricing.subscriptionLoadError'),
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [t]);
  useEffect(() => {
    document.title = t('landing.pricing.pageTitle');
    void loadSubscription();
  }, [loadSubscription, t]);
  useEffect(() => {
    if (validPlan && validPeriod) return;
    const normalized = new URLSearchParams({
      plan: validPlan ? requestedPlan : 'pro',
      period: validPeriod ? requestedPeriod : 'monthly',
    });
    if (paymentResult === 'cancelled') normalized.set('payment', paymentResult);
    setSearchParams(normalized, { replace: true });
  }, [
    paymentResult,
    requestedPeriod,
    requestedPlan,
    setSearchParams,
    validPeriod,
    validPlan,
  ]);
  const currentPlan = useMemo<PlanId>(
    () => (sub?.plan === 'pro' || sub?.plan === 'ultimate' ? sub.plan : 'free'),
    [sub],
  );
  const hasPaidSubscription =
    sub?.subscription_status === 'active' ||
    sub?.subscription_status === 'trialing';
  const handleCheckout = async (
    plan: Exclude<PlanId, 'free'>,
    chosenPeriod: Period,
  ) => {
    setLoadingPlan(plan);
    setNotice(null);
    try {
      const checkout = await subscriptionService.checkout({
        plan,
        period: chosenPeriod,
        coupon: promoCode.trim() || undefined,
      });
      if (checkout.mode === 'stripe' && checkout.checkout_url) {
        window.location.assign(checkout.checkout_url);
        return;
      }
      setSub(await subscriptionService.getMe());
      setNotice({ tone: 'success', text: t('monCompte.proActivated') });
    } catch {
      setNotice({ tone: 'error', text: t('monCompte.proActivateError') });
    } finally {
      setLoadingPlan(null);
    }
  };
  const handleCta = (id: PlanId, chosenPeriod: Period) => {
    if (id === 'free' || PLAN_RANK[id] < PLAN_RANK[currentPlan]) return;
    if (hasPaidSubscription) {
      setLoadingPlan(id);
      setNotice(null);
      void subscriptionService
        .portal()
        .then(({ portal_url }) => window.location.assign(portal_url))
        .catch(() =>
          setNotice({ tone: 'error', text: t('monCompte.portalError') }),
        )
        .finally(() => setLoadingPlan(null));
      return;
    }
    void handleCheckout(id as Exclude<PlanId, 'free'>, chosenPeriod);
  };
  const selectPlan = (id: PlanId) => {
    setSelectedPlan(id);
    if (id !== 'free') setSearchParams({ plan: id, period }, { replace: true });
  };
  const selectPeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    if (selectedPlan !== 'free')
      setSearchParams(
        { plan: selectedPlan, period: nextPeriod },
        { replace: true },
      );
  };
  return (
    <main className={classes.page}>
      <header className={classes.header}>
        <div>
          <p className={classes.kicker}>{t('landing.pricing.pageKicker')}</p>
          <h1 className={classes.title}>{t('landing.pricing.pageTitle2')}</h1>
          <p className={classes.subtitle}>
            {t('landing.pricing.pageSubtitle')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t('landing.pricing.back')}
        </Button>
      </header>
      {!hasPaidSubscription && (
        <div className={classes.controlsRow}>
          <div className={classes.periodControl}>
            <span className={classes.controlsLabel}>
              {t('landing.pricing.periodLabel')}
            </span>
            <div
              className={classes.segmented}
              role="group"
              aria-label={t('landing.pricing.periodLabel')}
            >
              <button
                type="button"
                className={period === 'monthly' ? classes.activePeriod : ''}
                onClick={() => selectPeriod('monthly')}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                type="button"
                className={period === 'yearly' ? classes.activePeriod : ''}
                onClick={() => selectPeriod('yearly')}
              >
                {t('landing.pricing.yearly')}
              </button>
            </div>
            {period === 'yearly' && (
              <span className={classes.savingsBadge}>
                {t('landing.pricing.savingsBadge')}
              </span>
            )}
          </div>
          <label className={classes.promoWrap}>
            <span className={classes.controlsLabel}>
              {t('landing.pricing.promoLabel')}
            </span>
            <input
              className="ot-control"
              placeholder={promoPlaceholder}
              value={promoCode}
              onChange={(event) =>
                setPromoCode(event.target.value.toUpperCase())
              }
            />
            <small>{t('landing.pricing.promoDescription')}</small>
          </label>
        </div>
      )}
      {hasPaidSubscription && (
        <div className="ot-alert" data-tone="info" role="status">
          {t('landing.pricing.paidPortalHint')}
        </div>
      )}
      {notice && (
        <div
          className="ot-alert"
          data-tone={notice.tone}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.text}</span>
          {subscriptionLoadFailed && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => void loadSubscription()}
              disabled={subscriptionLoading}
            >
              {subscriptionLoading
                ? t('landing.pricing.subscriptionRetrying')
                : t('landing.pricing.subscriptionRetry')}
            </Button>
          )}
        </div>
      )}
      {paymentResult === 'cancelled' && (
        <div className="ot-alert" data-tone="info" role="status">
          {t('checkout.cancelled')}
        </div>
      )}
      <div className={classes.grid}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            isCurrent={currentPlan === plan.id}
            period={period}
            onSelect={selectPlan}
            onCta={handleCta}
            mode="app"
            loading={loadingPlan === plan.id}
            checkoutDisabled={
              subscriptionLoading ||
              subscriptionLoadFailed ||
              (!hasPaidSubscription && !cgvAccepted)
            }
            appCtaLabel={
              hasPaidSubscription
                ? t('landing.pricing.manageViaPortal')
                : undefined
            }
          />
        ))}
      </div>
      {!hasPaidSubscription && (
        <section className={classes.checkoutPanel}>
          <label className={classes.checkbox}>
            <input
              type="checkbox"
              checked={cgvAccepted}
              onChange={(event) => setCgvAccepted(event.target.checked)}
            />
            <span>
              {t('landing.pricing.cgvLabel')}{' '}
              <Link to="/cgv" target="_blank" rel="noreferrer">
                {t('landing.pricing.cgvLink')}
              </Link>{' '}
              {t('landing.pricing.cgvSuffix')}
            </span>
          </label>
          <p>{t('landing.pricing.checkoutLegalHint')}</p>
        </section>
      )}
      <section className={classes.transparency}>
        <p className={classes.kicker}>
          {t('landing.pricing.transparencyKicker')}
        </p>
        <h2 className={classes.transparencyTitle}>
          {t('landing.pricing.transparencyTitle')}
        </h2>
        <div className={classes.transparencyGrid}>
          {[
            [
              t('landing.pricing.transparencyItem1Title'),
              t('landing.pricing.transparencyItem1Desc'),
            ],
            [
              t('landing.pricing.transparencyItem2Title'),
              t('landing.pricing.transparencyItem2Desc'),
            ],
            [
              t('landing.pricing.transparencyItem3Title'),
              t('landing.pricing.transparencyItem3Desc'),
            ],
          ].map(([title, description]) => (
            <div key={title} className={classes.transparencyItem}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
