import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Stack, Paper, SimpleGrid, Group, Text, Title, TextInput, Modal,
  PasswordInput, Progress, Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authService, subscriptionService } from '../services/api';
import { Button } from '../components/atoms/Button';
import classes from './MonCompte.module.css';

export function MonCompte() {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();

  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMe(),
    staleTime: 60 * 1000,
  });

  const [form, setForm] = useState({ prenom: user?.prenom || '', nom: user?.nom || '' });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => { document.title = 'Mon compte — OfferTrail'; }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authService.updateMe(form);
      setUserData(updated);
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
      await authService.changePassword(passwordForm.current_password, passwordForm.new_password);
      notifications.show({ message: 'Mot de passe mis à jour', color: 'green' });
      setPasswordOpen(false);
      setPasswordForm({ current_password: '', new_password: '' });
    } catch {
      notifications.show({ message: 'Impossible de modifier le mot de passe.', color: 'red' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const usagePercent = Math.min(((sub?.candidatures_count ?? 0) / 25) * 100, 100);

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {/* Banner */}
      <Paper className={classes.banner} p="xl" radius="lg" withBorder>
        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Mon compte</Text>
        <Title order={1} mt="xs">Profil, sécurité et abonnement au même endroit.</Title>
        <Text c="dimmed" mt="sm">
          Le socle abonnement est prêt pour recevoir Mollie sans réécriture métier.
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
              <Badge
                variant="light"
                color={sub?.is_pro ? 'green' : 'gray'}
                size="lg"
              >
                {sub?.is_pro ? 'Pro' : 'Accès limité'}
              </Badge>
              <Button variant="ghost" size="small" onClick={() => navigate('/app/pricing')}>
                {sub?.is_pro ? 'Gérer' : 'Passer en Pro →'}
              </Button>
            </Group>
            {sub?.is_pro ? (
              <Text size="sm" c="dimmed">
                Plan démarré le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
              </Text>
            ) : (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {sub?.candidatures_count ?? 0} / 25 candidatures utilisées
                </Text>
                <Progress
                  value={usagePercent}
                  color={usagePercent >= 100 ? 'red' : 'blue'}
                  size="sm"
                  radius="xs"
                />
              </Stack>
            )}
          </Paper>

          {/* Payment */}
          <Paper p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Moyen de paiement</Text>
            {sub?.is_pro ? (
              <Group justify="space-between">
                <Group gap="sm">
                  <Paper p="xs" radius="sm" withBorder style={{ width: 36, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text size="xs" c="dimmed">CB</Text>
                  </Paper>
                  <Text size="sm" c="dimmed">Disponible après activation Mollie</Text>
                </Group>
                <Button variant="ghost" size="small" disabled>Modifier</Button>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">Aucun moyen de paiement enregistré.</Text>
            )}
          </Paper>

          {/* Invoices */}
          <Paper p="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Factures</Text>
              <Button variant="ghost" size="small" disabled>Exporter</Button>
            </Group>
            <Text size="sm" c="dimmed" ta="center" py="md">
              Disponible après activation du paiement Mollie
            </Text>
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Password modal */}
      <Modal opened={passwordOpen} onClose={() => setPasswordOpen(false)} title="Modifier le mot de passe">
        <form onSubmit={changePassword}>
          <Stack gap="md">
            <PasswordInput
              label="Mot de passe actuel"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
            />
            <PasswordInput
              label="Nouveau mot de passe"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
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
