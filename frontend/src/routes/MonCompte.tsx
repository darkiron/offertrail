import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { useAuth } from '../context/auth-context';
import { ApiError } from '@shared/api/ApiError';
import { planKeys } from '@entities/plan/queryKeys';
import { useSubscriptionStatusQuery } from '@features/billing/useSubscriptionQueries';
import { usePortalMutation } from '@features/billing/useBillingMutations';
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from '@features/account/useAccountMutations';
import { Button } from '@shared/ui/Button';
import { Dialog } from '@shared/ui/Dialog';
import { PageHeader } from '@shared/ui/PageHeader';
import { SubscriptionOverview } from '@widgets/billing/SubscriptionOverview';
import classes from './MonCompte.module.scss';

type Notice = { tone: 'success' | 'error'; text: string };

export function MonCompte() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: sub,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    refetch: retrySubscription,
  } = useSubscriptionStatusQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const portalMutation = usePortalMutation();
  const [form, setForm] = useState({
    prenom: profile?.prenom || '',
    nom: profile?.nom || '',
  });
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [paymentParamsHandled, setPaymentParamsHandled] = useState(false);
  const saving = updateProfileMutation.isPending;
  const passwordSaving = changePasswordMutation.isPending;
  const portalLoading = portalMutation.isPending;
  const hasPaidSubscription =
    sub?.subscription_status === 'active' ||
    sub?.subscription_status === 'trialing';
  const payment = searchParams.get('payment');
  const reason = searchParams.get('reason');

  // Keep the form in sync with the loaded profile without re-running on
  // every render (adjusting state while rendering, per React's guidance).
  if (profile && profile.id !== syncedProfileId) {
    setSyncedProfileId(profile.id);
    setForm({ prenom: profile.prenom || '', nom: profile.nom || '' });
  }
  // Surface the payment/reason redirect notice once, without leaving it in
  // an effect body (adjusting state while rendering, per React's guidance).
  if ((payment || reason) && !paymentParamsHandled) {
    setPaymentParamsHandled(true);
    setNotice({
      tone:
        payment === 'success'
          ? 'success'
          : payment === 'cancelled'
            ? 'error'
            : 'error',
      text:
        payment === 'success'
          ? t('monCompte.paymentSuccess')
          : payment === 'cancelled'
            ? t('monCompte.paymentCancelled')
            : t('monCompte.upgradeFromPricing'),
    });
  }

  useEffect(() => {
    document.title = t('monCompte.pageTitle');
  }, [t]);
  useEffect(() => {
    if (!paymentParamsHandled) return;
    void queryClient.invalidateQueries({
      queryKey: planKeys.subscriptionStatus(),
    });
    const next = new URLSearchParams(searchParams);
    next.delete('payment');
    next.delete('reason');
    setSearchParams(next, { replace: true });
    // Runs once the redirect params have been captured into notice state;
    // searchParams/setSearchParams intentionally excluded to avoid re-firing
    // after this effect rewrites the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentParamsHandled, queryClient]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    try {
      await updateProfileMutation.mutateAsync(form);
      await refreshProfile();
      setNotice({ tone: 'success', text: t('monCompte.profileSaved') });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/login');
        return;
      }
      setNotice({ tone: 'error', text: t('monCompte.profileError') });
    }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    try {
      await changePasswordMutation.mutateAsync(password);
      setPassword('');
      setPasswordOpen(false);
      setNotice({ tone: 'success', text: t('monCompte.passwordUpdated') });
    } catch {
      setNotice({ tone: 'error', text: t('monCompte.passwordError') });
    }
  };
  const openPortal = () => {
    setNotice(null);
    portalMutation.mutate(undefined, {
      onSuccess: ({ portal_url }) => window.location.assign(portal_url),
      onError: (error) => {
        const detail =
          error instanceof ApiError &&
          error.status !== undefined &&
          error.status < 500
            ? error.message
            : t('monCompte.portalError');
        setNotice({ tone: 'error', text: detail });
      },
    });
  };

  return (
    <main className={classes.shell}>
      <PageHeader
        variant="editorial"
        kicker={t('monCompte.bannerEyebrow')}
        title={t('monCompte.bannerTitle')}
        description={t('monCompte.bannerSub')}
      />
      {notice && (
        <div
          className={classes.notice}
          data-tone={notice.tone}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}
      {subscriptionError ? (
        <section className={classes.state} role="alert">
          <strong>{t('monCompte.subscriptionErrorTitle')}</strong>
          <p>{t('monCompte.subscriptionErrorDescription')}</p>
          <Button variant="secondary" onClick={() => void retrySubscription()}>
            {t('common.retry')}
          </Button>
        </section>
      ) : subscriptionLoading ? (
        <section className={classes.state} aria-live="polite">
          {t('monCompte.subscriptionLoading')}
        </section>
      ) : (
        <SubscriptionOverview
          subscription={sub}
          loading={portalLoading}
          onManage={openPortal}
          onUpgrade={() => navigate('/app/checkout?plan=pro&period=monthly')}
          onUpgradeUltimate={openPortal}
        />
      )}
      <div className={classes.layout}>
        <section id="profil" className={classes.panel}>
          <div className={classes.sectionHead}>
            <span className={classes.kicker}>
              {t('monCompte.profileTitle')}
            </span>
            <h2>{t('monCompte.profileTitle')}</h2>
          </div>
          <form className={classes.stack} onSubmit={saveProfile}>
            <div className={classes.formGrid}>
              <label className={classes.field}>
                <span>{t('monCompte.firstName')}</span>
                <input
                  className={classes.control}
                  value={form.prenom}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      prenom: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={classes.field}>
                <span>{t('monCompte.lastName')}</span>
                <input
                  className={classes.control}
                  value={form.nom}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nom: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className={classes.field}>
              <span>{t('monCompte.email')}</span>
              <input
                className={classes.control}
                value={user?.email || ''}
                disabled
              />
            </label>
            <div className={classes.actions}>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('monCompte.saving') : t('monCompte.save')}
              </Button>
            </div>
          </form>
        </section>
        <div className={classes.stack}>
          <section id="securite" className={classes.panel}>
            <div className={classes.sectionHead}>
              <span className={classes.kicker}>
                {t('monCompte.passwordModalTitle')}
              </span>
              <h2>{t('monCompte.changePassword')}</h2>
            </div>
            <p className={classes.subtitle}>
              {t('monCompte.securityDescription')}
            </p>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setPasswordOpen(true)}
            >
              {t('monCompte.changePassword')}
            </Button>
          </section>
          <section id="facturation" className={classes.panel}>
            <div className={classes.sectionHead}>
              <span className={classes.kicker}>
                {t('monCompte.invoicesTitle')}
              </span>
              <h2>{t('monCompte.invoicesTitle')}</h2>
            </div>
            <p className={classes.subtitle}>
              {hasPaidSubscription
                ? t('monCompte.invoicesDesc')
                : t('monCompte.invoicesNA')}
            </p>
            {hasPaidSubscription ? (
              <Button
                variant="ghost"
                size="small"
                onClick={openPortal}
                disabled={portalLoading}
              >
                {t('monCompte.viewInvoices')}
              </Button>
            ) : (
              <button
                className={classes.textButton}
                type="button"
                onClick={() =>
                  navigate('/app/checkout?plan=pro&period=monthly')
                }
              >
                {t('monCompte.invoicesUpgrade')}
              </button>
            )}
          </section>
        </div>
      </div>
      {passwordOpen && (
        <Dialog
          eyebrow={t('monCompte.passwordModalTitle')}
          title={t('monCompte.passwordModalTitle')}
          onClose={() => setPasswordOpen(false)}
        >
          <form className={classes.stack} onSubmit={changePassword}>
            <label className={classes.field}>
              <span>{t('monCompte.newPassword')}</span>
              <input
                className={classes.control}
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <Button type="submit" variant="primary" disabled={passwordSaving}>
              {passwordSaving
                ? t('monCompte.updatingPassword')
                : t('monCompte.savePassword')}
            </Button>
          </form>
        </Dialog>
      )}
    </main>
  );
}
