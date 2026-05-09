import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useI18n } from '../i18n';
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

  useEffect(() => { document.title = t('monCompte.pageTitle'); }, [t]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === 'success') {
      notifications.show({ message: t('monCompte.paymentSuccess'), color: 'green' });
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (paymentStatus === 'cancelled') {
      notifications.show({ message: t('monCompte.paymentCancelled'), color: 'yellow' });
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
      notifications.show({ message: t('monCompte.profileSaved'), color: 'green' });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) { navigate('/login'); return; }
      notifications.show({ message: t('monCompte.profileError'), color: 'red' });
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
      notifications.show({ message: t('monCompte.passwordUpdated'), color: 'green' });
      setPasswordOpen(false);
      setPasswordForm({ new_password: '' });
    } catch {
      notifications.show({ message: t('monCompte.passwordError'), color: 'red' });
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
      const detail = (axios.isAxiosError(err) && err.response?.data?.detail) || t('monCompte.portalError');
      notifications.show({ message: detail, color: 'red' });
      setPortalLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {/* Banner */}
      <Paper className={classes.banner} p="xl" radius="lg" withBorder>
        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('monCompte.bannerEyebrow')}</Text>
        <Title order={1} mt="xs">{t('monCompte.bannerTitle')}</Title>
        <Text c="dimmed" mt="sm">{t('monCompte.bannerSub')}</Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        {/* Profile card */}
        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('monCompte.profileTitle')}</Text>
          <form onSubmit={saveProfile}>
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label={t('monCompte.firstName')}
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
                <TextInput
                  label={t('monCompte.lastName')}
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </SimpleGrid>
              <TextInput label={t('monCompte.email')} value={user?.email || ''} disabled />
              <Group>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? t('monCompte.saving') : t('monCompte.save')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPasswordOpen(true)}>
                  {t('monCompte.changePassword')}
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {/* Subscription card */}
        <Stack gap="md">
          {/* Plan */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('monCompte.subscriptionTitle')}</Text>
            <Group justify="space-between" mb="sm">
              {sub?.is_active && (
                <Badge variant="light" color="green" size="lg">Pro</Badge>
              )}
              {sub?.is_active ? (
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? t('monCompte.redirecting') : t('monCompte.managePro')}
                </Button>
              ) : (
                <Button variant="ghost" size="small" onClick={() => navigate('/app/pricing')}>
                  {t('monCompte.upgradePro')}
                </Button>
              )}
            </Group>
            {sub?.is_active && (
              <Text size="sm" c="dimmed">
                {t('monCompte.planStartedAt')}{' '}
                {sub.plan_started_at
                  ? new Date(sub.plan_started_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')
                  : '-'}
              </Text>
            )}
          </Paper>

          {/* Invoices */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('monCompte.invoicesTitle')}</Text>
            {sub?.is_active ? (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">{t('monCompte.invoicesDesc')}</Text>
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? '...' : t('monCompte.viewInvoices')}
                </Button>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                {t('monCompte.invoicesNA')}{' '}
                <Anchor size="sm" onClick={() => navigate('/app/pricing')} style={{ cursor: 'pointer' }}>
                  {t('monCompte.invoicesUpgrade')}
                </Anchor>
              </Text>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Password modal */}
      <Modal opened={passwordOpen} onClose={() => setPasswordOpen(false)} title={t('monCompte.passwordModalTitle')}>
        <form onSubmit={changePassword}>
          <Stack gap="md">
            <PasswordInput
              label={t('monCompte.newPassword')}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ new_password: e.target.value })}
              minLength={8}
            />
            <Button type="submit" variant="primary" disabled={passwordSaving}>
              {passwordSaving ? t('monCompte.updatingPassword') : t('monCompte.savePassword')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
