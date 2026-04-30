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
import classes from './MonCompte.module.css';

export function MonCompte() {
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

  useEffect(() => { document.title = 'Mon compte — OfferTrail'; }, []);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === 'success') {
      notifications.show({ message: 'Paiement confirmé. Mise à jour de ton abonnement en cours.', color: 'green' });
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (paymentStatus === 'cancelled') {
      notifications.show({ message: 'Paiement annulé.', color: 'yellow' });
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
      notifications.show({ message: 'Profil enregistré', color: 'green' });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) { navigate('/login'); return; }
      notifications.show({ message: 'Impossible de mettre à jour le profil.', color: 'red' });
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
      notifications.show({ message: 'Mot de passe mis à jour', color: 'green' });
      setPasswordOpen(false);
      setPasswordForm({ new_password: '' });
    } catch {
      notifications.show({ message: 'Impossible de modifier le mot de passe.', color: 'red' });
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
      const detail = (axios.isAxiosError(err) && err.response?.data?.detail) || 'Impossible d\'ouvrir le portail Stripe.';
      notifications.show({ message: detail, color: 'red' });
      setPortalLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {/* Banner */}
      <Paper className={classes.banner} p="xl" radius="lg" withBorder>
        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Mon compte</Text>
        <Title order={1} mt="xs">Profil, sécurité et abonnement au même endroit.</Title>
        <Text c="dimmed" mt="sm">
          L&apos;abonnement est géré avec Stripe pour un passage au plan Pro sans friction.
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        {/* Profile card */}
        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Profil</Text>
          <form onSubmit={saveProfile}>
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label="Prénom"
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
                <TextInput
                  label="Nom"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </SimpleGrid>
              <TextInput label="Email" value={user?.email || ''} disabled />
              <Group>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPasswordOpen(true)}>
                  Modifier le mot de passe
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {/* Subscription card */}
        <Stack gap="md">
          {/* Plan */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Abonnement</Text>
            <Group justify="space-between" mb="sm">
              {sub?.is_active && (
                <Badge variant="light" color="green" size="lg">Pro</Badge>
              )}
              {sub?.is_active && sub?.has_stripe_customer ? (
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? 'Redirection...' : 'Gérer via Stripe →'}
                </Button>
              ) : sub?.is_active ? null : (
                <Button variant="ghost" size="small" onClick={() => navigate('/app/pricing')}>
                  Passer en Pro →
                </Button>
              )}
            </Group>
            {sub?.is_active && (
              <Text size="sm" c="dimmed">
                Plan démarré le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
              </Text>
            )}
          </Paper>

          {/* Factures — portail Stripe si abonnement actif */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Factures</Text>
            {sub?.is_active && sub?.has_stripe_customer ? (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">Historique et téléchargement via Stripe</Text>
                <Button variant="ghost" size="small" onClick={openStripePortal} disabled={portalLoading}>
                  {portalLoading ? '...' : 'Voir les factures →'}
                </Button>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Disponible après souscription au plan Pro.{' '}
                <Anchor size="sm" onClick={() => navigate('/app/pricing')} style={{ cursor: 'pointer' }}>
                  Passer en Pro →
                </Anchor>
              </Text>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Password modal */}
      <Modal opened={passwordOpen} onClose={() => setPasswordOpen(false)} title="Modifier le mot de passe">
        <form onSubmit={changePassword}>
          <Stack gap="md">
            <PasswordInput
              label="Nouveau mot de passe"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ new_password: e.target.value })}
              minLength={8}
            />
            <Button type="submit" variant="primary" disabled={passwordSaving}>
              {passwordSaving ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
