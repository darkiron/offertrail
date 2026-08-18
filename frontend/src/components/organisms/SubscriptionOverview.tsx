import type { SubscriptionStatus } from '../../types';
import { useI18n } from '../../i18n';
import { Button } from '../atoms/Button';

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

export function SubscriptionOverview({ subscription, loading = false, onManage, onUpgrade, onUpgradeUltimate }: SubscriptionOverviewProps) {
  const { t, locale } = useI18n();
  const plan = subscription?.is_active ? (subscription.plan === 'ultimate' ? 'Ultimate' : 'Pro') : 'Free';
  const applications = numberFrom(subscription?.usage, 'candidatures');
  const applicationsLimit = numberFrom(subscription?.limits, 'candidatures_max');
  const followups = numberFrom(subscription?.usage, 'relances_active');
  const followupsLimit = numberFrom(subscription?.limits, 'relances_max');
  const formatLimit = (value: number) => value === 0 ? t('monCompte.unlimited') : String(value);
  const startedAt = subscription?.plan_started_at
    ? new Date(subscription.plan_started_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')
    : '—';

  return <section className="ot-subscription-overview" aria-labelledby="subscription-title">
    <div className="ot-subscription-overview__lead">
      <span className="ot-kicker">{t('monCompte.subscriptionTitle')}</span>
      <div className="ot-subscription-overview__title"><h2 id="subscription-title">{plan}</h2><span className="ot-badge" data-tone="success">{subscription?.is_active ? t('monCompte.active') : t('monCompte.freeStatus')}</span></div>
      <p>{subscription?.is_active ? `${t('monCompte.planStartedAt')} ${startedAt}` : t('monCompte.upgradeFromPricing')}</p>
      <div className="ot-subscription-overview__actions"><Button variant="ghost" onClick={subscription?.is_active ? onManage : onUpgrade} disabled={loading}>{loading ? t('monCompte.redirecting') : subscription?.is_active ? t('monCompte.managePro') : t('monCompte.upgradePro')}</Button>{subscription?.is_active && subscription.plan === 'pro' ? <Button variant="secondary" onClick={onUpgradeUltimate} disabled={loading}>{t('monCompte.upgradeUltimate')}</Button> : null}</div>
    </div>
    <dl className="ot-subscription-overview__metrics">
      <div><dt>{t('monCompte.billingPeriod')}</dt><dd>{subscription?.billing_period === 'yearly' ? t('monCompte.yearly') : subscription?.billing_period === 'monthly' ? t('monCompte.monthly') : '—'}</dd></div>
      <div><dt>{t('monCompte.applicationsUsage')}</dt><dd>{applications} <span>/ {formatLimit(applicationsLimit)}</span></dd></div>
      <div><dt>{t('monCompte.followupsUsage')}</dt><dd>{followups} <span>/ {formatLimit(followupsLimit)}</span></dd></div>
    </dl>
  </section>;
}
