import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Stack, Paper, SimpleGrid, Group, Text, Title, TextInput, Modal,
  PasswordInput, Badge, Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { authService, subscriptionService } from '../services/api';
import { Button } from '../components/atoms/Button';
import { useI18n } from '../i18n';
import classes from './MonCompte.module.css';

export function MonCompte() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMe(),
    staleTime: 60 * 1000,
  });

  const [form, setForm] = useState({ prenom: profile?.prenom || '', nom: profile?.nom || '' });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => { document.title = t('account.title') + ' — OfferTrail'; }, [t]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === 'success') {
      notifications.show({ message: t('account.paymentSuccess'), color: 'green' });
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (paymentStatus === 'cancelled') {
      notifications.show({ message: t('account.paymentCancelled'), color: 'yellow' });
    }

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('payment');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  // Synchronise le formulaire quand le profil est chargé
  useEffect(() => {
    if (profile) {
      setForm({ prenom: profile.prenom || '', nom: profile.nom || '' });
    }
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateMe(form);
      await refreshProfile();
      notifications.show({ message: t('account.notifSuccess'), color: 'green' });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) { navigate('/login'); return; }
      notifications.show({ message: t('account.notifError'), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;
      notifications.show({ message: t('account.passwordUpdateSuccess'), color: 'green' });
      setPasswordOpen(false);
      setPasswordForm({ new_password: '' });
    } catch {
      notifications.show({ message: t('account.passwordUpdateError'), color: 'red' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const { portal_url } = await subscriptionService.portal();
      window.location.assign(portal_url);
    } catch (err: unknown) {
      const detail = (axios.isAxiosError(err) && err.response?.data?.detail) || t('account.stripeError');
      notifications.show({ message: detail, color: 'red' });
      setPortalLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {/* Banner */}
      <Paper className={classes.banner} p="xl" radius="lg" withBorder>
        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('account.title')}</Text>
        <Title order={1} mt="xs">{t('account.subtitle')}</Title>
        <Text c="dimmed" mt="sm">
          {t('account.copy')}
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        {/* Profile card */}
        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('account.profile')}</Text>
          <form onSubmit={saveProfile}>
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label={t('account.firstname')}
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
                <TextInput
                  label={t('account.lastname')}
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </SimpleGrid>
              <TextInput label={t('account.email')} value={user?.email || ''} disabled />
              <Group>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? t('account.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPasswordOpen(true)}>
                  {t('account.changePassword')}
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {/* Subscription card */}
        <Stack gap="md">
          {/* Plan */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('account.subscription')}</Text>
            <Group justify="space-between" mb="sm">
              {sub?.is_active && (
                <Badge variant="light" color="green" size="lg">Pro</Badge>
              )}
              {sub?.is_active ? (
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? t('account.redirection') : t('account.manageStripe')}
                </Button>
              ) : (
                <Button variant="ghost" size="small" onClick={() => navigate('/app/pricing')}>
                  {t('account.upgradePro')}
                </Button>
              )}
            </Group>
            {sub?.is_active && (
              <Text size="sm" c="dimmed">
                {t('account.planStarted', { date: sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US') : '-' })}
              </Text>
            )}
          </Paper>

          {/* Factures — portail Stripe si abonnement actif */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('account.invoices')}</Text>
            {sub?.is_active ? (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">{t('account.invoiceHistory')}</Text>
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? '...' : t('account.viewInvoices')}
                </Button>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                {t('account.proOnly')}{' '}
                <Anchor size="sm" onClick={() => navigate('/app/pricing')} style={{ cursor: 'pointer' }}>
                  {t('account.upgradePro')}
                </Anchor>
              </Text>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Password modal */}
      <Modal opened={passwordOpen} onClose={() => setPasswordOpen(false)} title={t('account.passwordModalTitle')}>
        <form onSubmit={changePassword}>
          <Stack gap="md">
            <PasswordInput
              label={t('account.newPassword')}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ new_password: e.target.value })}
              minLength={8}
            />
            <Button type="submit" variant="primary" disabled={passwordSaving}>
              {passwordSaving ? t('account.updating') : t('account.savePassword')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
