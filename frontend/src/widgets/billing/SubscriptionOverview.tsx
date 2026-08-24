import type { SubscriptionStatus } from '../../types';
import { useI18n } from '../../i18n';
import { Button } from '@shared/ui/Button';
import classes from './SubscriptionOverview.module.scss';

interface SubscriptionOverviewProps {
  subscription?: SubscriptionStatus;
  loading?: boolean;
  onManage: () => void;
  onUpgrade: () => void;
  onUpgradeUltimate: () => void;
}

function numberFrom(record: Record<string, unknown> | undefined, key: string) {
  const value = Number(record?.[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function SubscriptionOverview({
  subscription,
  loading = false,
  onManage,
  onUpgrade,
  onUpgradeUltimate,
}: SubscriptionOverviewProps) {
  const { t, locale } = useI18n();
  const hasPaidSubscription =
    subscription?.subscription_status === 'active' ||
    subscription?.subscription_status === 'trialing';
  const plan = hasPaidSubscription
    ? subscription.plan === 'ultimate'
      ? t('admin.planUltimate')
      : t('admin.planPro')
    : t('admin.planFree');
  const applications = numberFrom(subscription?.usage, 'candidatures');
  const applicationsLimit = numberFrom(
    subscription?.limits,
    'candidatures_max',
  );
  const followups = numberFrom(subscription?.usage, 'relances_active');
  const followupsLimit = numberFrom(subscription?.limits, 'relances_max');
  const formatLimit = (value: number) =>
    value === 0 ? t('monCompte.unlimited') : String(value);
  const startedAt = subscription?.plan_started_at
    ? new Date(subscription.plan_started_at).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'fr-FR',
      )
    : '—';

  return (
    <section className={classes.shell} aria-labelledby="subscription-title">
      <div className={classes.lead}>
        <span className={classes.kicker}>
          {t('monCompte.subscriptionTitle')}
        </span>
        <div className={classes.title}>
          <h2 id="subscription-title">{plan}</h2>
          <span className={classes.badge} data-tone="success">
            {hasPaidSubscription
              ? t('monCompte.active')
              : t('monCompte.freeStatus')}
          </span>
        </div>
        <p>
          {hasPaidSubscription
            ? `${t('monCompte.planStartedAt')} ${startedAt}`
            : t('monCompte.upgradeFromPricing')}
        </p>
        <div className={classes.actions}>
          <Button
            variant="ghost"
            onClick={hasPaidSubscription ? onManage : onUpgrade}
            disabled={loading}
          >
            {loading
              ? t('monCompte.redirecting')
              : hasPaidSubscription
                ? t('monCompte.managePro')
                : t('monCompte.upgradePro')}
          </Button>
          {hasPaidSubscription && subscription?.plan === 'pro' ? (
            <Button
              variant="secondary"
              onClick={onUpgradeUltimate}
              disabled={loading}
            >
              {t('monCompte.upgradeUltimate')}
            </Button>
          ) : null}
        </div>
      </div>
      <dl className={classes.metrics}>
        <div>
          <dt>{t('monCompte.billingPeriod')}</dt>
          <dd>
            {subscription?.billing_period === 'yearly'
              ? t('monCompte.yearly')
              : subscription?.billing_period === 'monthly'
                ? t('monCompte.monthly')
                : '—'}
          </dd>
        </div>
        <div>
          <dt>{t('monCompte.applicationsUsage')}</dt>
          <dd>
            {applications} <span>/ {formatLimit(applicationsLimit)}</span>
          </dd>
        </div>
        <div>
          <dt>{t('monCompte.followupsUsage')}</dt>
          <dd>
            {followups} <span>/ {formatLimit(followupsLimit)}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
