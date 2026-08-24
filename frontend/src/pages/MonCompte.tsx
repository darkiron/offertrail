import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useI18n } from '../i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { authService, subscriptionService } from '../services/api';
import { Button } from '@shared/ui/Button';
import { Dialog } from '@shared/ui/Dialog';
import { PageHeader } from '@shared/ui/PageHeader';
import { SubscriptionOverview } from '@widgets/billing/SubscriptionOverview';
import classes from './MonCompte.module.scss';

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
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMe(),
    staleTime: 60000,
  });
  const [form, setForm] = useState({
    prenom: profile?.prenom || '',
    nom: profile?.nom || '',
  });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const hasPaidSubscription =
    sub?.subscription_status === 'active' ||
    sub?.subscription_status === 'trialing';

  useEffect(() => {
    document.title = t('monCompte.pageTitle');
  }, [t]);
  useEffect(() => {
    if (profile)
      setForm({ prenom: profile.prenom || '', nom: profile.nom || '' });
  }, [profile]);
  useEffect(() => {
    const payment = searchParams.get('payment');
    const reason = searchParams.get('reason');
    if (!payment && !reason) return;
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
    void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    const next = new URLSearchParams(searchParams);
    next.delete('payment');
    next.delete('reason');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, queryClient, t]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await authService.updateMe(form);
      await refreshProfile();
      setNotice({ tone: 'success', text: t('monCompte.profileSaved') });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setNotice({ tone: 'error', text: t('monCompte.profileError') });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSaving(true);
    setNotice(null);
    try {
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      setPassword('');
      setPasswordOpen(false);
      setNotice({ tone: 'success', text: t('monCompte.passwordUpdated') });
    } catch {
      setNotice({ tone: 'error', text: t('monCompte.passwordError') });
    } finally {
      setPasswordSaving(false);
    }
  };
  const openPortal = async () => {
    setPortalLoading(true);
    setNotice(null);
    try {
      const result = await subscriptionService.portal();
      window.location.assign(result.portal_url);
    } catch (error) {
      const detail =
        axios.isAxiosError(error) &&
        error.response?.status &&
        error.response.status < 500 &&
        typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : t('monCompte.portalError');
      setNotice({ tone: 'error', text: detail });
      setPortalLoading(false);
    }
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
          onManage={() => void openPortal()}
          onUpgrade={() => navigate('/app/checkout?plan=pro&period=monthly')}
          onUpgradeUltimate={() => void openPortal()}
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
                onClick={() => void openPortal()}
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
