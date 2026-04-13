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

      <div style={{
        marginTop: '0.5rem',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '0.5px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-default)',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase' as const,
          letterSpacing: '.08em',
          color: 'var(--mantine-color-dimmed)',
          margin: '0 0 12px',
        }}>
          Où va ton argent ?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--mantine-color-default-border)', fontSize: '13px' }}>
          <span style={{ color: 'var(--mantine-color-dimmed)' }}>Stripe — traitement du paiement</span>
          <span style={{ color: 'var(--mantine-color-dimmed)' }}>~0,47€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--mantine-color-default-border)', fontSize: '13px' }}>
          <span style={{ color: 'var(--mantine-color-dimmed)' }}>URSSAF — charges sociales (33%)</span>
          <span style={{ color: 'var(--mantine-color-dimmed)' }}>~4,79€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
          <span style={{ fontWeight: 500 }}>Rémunération du développeur</span>
          <span style={{ fontWeight: 500, color: 'var(--mantine-color-green-6)' }}>~9,73€</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--mantine-color-dimmed)', marginTop: '12px', lineHeight: '1.6' }}>
          OfferTrail est développé et maintenu par{' '}
          <a href="https://craftcodes.fr" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--mantine-color-blue-6)', textDecoration: 'none' }}>
            CraftCodes
          </a>
          , une auto-entreprise indépendante. Pas d'équipe marketing,
          pas d'investisseurs. Juste un développeur qui a construit l'outil dont il avait besoin.
        </p>
      </div>
    </Stack>
  );
}
