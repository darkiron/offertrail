import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Group, List, Paper, Stack, Text, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';

export function Pricing() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const transparencyRows = [
    { label: 'Traitement du paiement', value: 'Stripe' },
    { label: 'Charges et obligations administratives', value: 'Exploitation du service' },
    { label: 'Développement, maintenance et support', value: 'CraftCodes' },
  ];

  useEffect(() => {
    document.title = 'Abonnement — OfferTrail';
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await subscriptionService.upgrade();
      const updated = await subscriptionService.getMe();
      setSub(updated);
      notifications.show({ message: 'Plan Pro activé !', color: 'green' });
    } catch {
      notifications.show({ message: "Impossible d'activer le plan Pro.", color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" maw={520} mx="auto">
      <Group>
        <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
        <Title order={2}>Passer en Pro</Title>
      </Group>

      {sub ? (
        <Text c="dimmed" size="sm">
          Plan actuel : <strong>{sub.is_pro ? 'Pro' : 'Aucun abonnement actif'}</strong>
        </Text>
      ) : null}

      <Paper p="xl" radius="lg" withBorder style={{ borderColor: 'rgba(14, 165, 233, 0.35)' }}>
        <Group justify="space-between" align="flex-start" mb="lg">
          <Stack gap={4}>
            <Text size="xs" fw={500} tt="uppercase" ls="0.08em" c="dimmed">Pro</Text>
            <Text size="xl" fw={500}>
              14,99€
              <Text component="span" size="sm" fw={400} c="dimmed">/mois</Text>
            </Text>
          </Stack>
          {sub?.is_pro ? (
            <Badge variant="light" color="green" size="sm">Actif</Badge>
          ) : null}
        </Group>

        <List
          spacing="sm"
          size="sm"
          c="dimmed"
          mb="xl"
          icon={<Text c="green" size="sm">✓</Text>}
        >
          {[
            'Candidatures illimitées',
            'Analytics complets',
            'Import TSV',
            'Relances',
            'Score de probité',
          ].map((feature) => (
            <List.Item key={feature}>{feature}</List.Item>
          ))}
        </List>

        {sub?.is_pro ? (
          <Text size="sm" c="dimmed">
            Actif depuis le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
          </Text>
        ) : (
          <Button variant="primary" onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Activation...' : 'Passer en Pro — 14,99€/mois'}
          </Button>
        )}
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        <Stack gap="sm">
          <Text size="xs" fw={500} tt="uppercase" ls="0.08em" c="dimmed">
            Transparence sur le prix
          </Text>

          {transparencyRows.map((row, index) => (
            <Group
              key={row.label}
              justify="space-between"
              pb={index < transparencyRows.length - 1 ? 'sm' : 0}
              style={index < transparencyRows.length - 1 ? { borderBottom: '1px solid var(--mantine-color-default-border)' } : undefined}
            >
              <Text size="sm" c="dimmed">{row.label}</Text>
              <Text size="sm" fw={500}>{row.value}</Text>
            </Group>
          ))}

          <Text size="sm" c="dimmed" lh={1.6}>
            OfferTrail est édité et maintenu par CraftCodes. Le prix de l&apos;abonnement finance
            le traitement du paiement, l&apos;exploitation du service et l&apos;évolution du produit.
          </Text>
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed" ta="center">
        Paiement sécurisé via Stripe
      </Text>
    </Stack>
  );
}
