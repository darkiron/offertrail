import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Group, List, Paper, Stack, Text, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { useI18n } from '../i18n';
import { Button } from '../components/atoms/Button';

export function Pricing() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const transparencyRows = [
    { label: t('pricing.transparency.payment'), value: 'Stripe' },
    { label: t('pricing.transparency.taxes'), value: t('pricing.transparency.copy').split('.')[1].trim() },
    { label: t('pricing.transparency.dev'), value: 'CraftCodes' },
  ];

  useEffect(() => {
    document.title = t('pricing.title') + ' — OfferTrail';
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, [t]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const checkout = await subscriptionService.checkout();

      if (checkout.mode === 'stripe' && checkout.checkout_url) {
        window.location.assign(checkout.checkout_url);
        return;
      }

      const updated = await subscriptionService.getMe();
      setSub(updated);
      notifications.show({ message: checkout.message || t('pricing.notifProActivated'), color: 'green' });
    } catch {
      notifications.show({ message: t('pricing.notifProError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" maw={520} mx="auto">
      <Group>
        <Button variant="ghost" onClick={() => navigate(-1)}>← {t('common.cancel')}</Button>
        <Title order={2}>{t('pricing.upgradeTitle')}</Title>
      </Group>

      {sub ? (
        <Text c="dimmed" size="sm">
          {t('pricing.currentPlan')} <strong>{sub.is_active ? 'Pro' : t('pricing.noActiveSubscription')}</strong>
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
          {sub?.is_active ? (
            <Badge variant="light" color="green" size="sm">{t('pricing.active')}</Badge>
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
            t('pricing.features.unlimited'),
            t('pricing.features.analytics'),
            t('pricing.features.probity'),
            t('pricing.features.followups'),
            t('pricing.features.export'),
          ].map((feature) => (
            <List.Item key={feature}>{feature}</List.Item>
          ))}
        </List>

        {sub?.is_active ? (
          <Text size="sm" c="dimmed">
            {t('pricing.activeSince', { date: sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US') : '-' })}
          </Text>
        ) : (
          <Button variant="primary" onClick={handleUpgrade} disabled={loading}>
            {loading ? t('account.redirection') : t('pricing.upgradeAction')}
          </Button>
        )}
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        <Stack gap="sm">
          <Text size="xs" fw={500} tt="uppercase" ls="0.08em" c="dimmed">
            {t('pricing.transparency.title')}
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
            {t('pricing.transparency.copy')}
          </Text>
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed" ta="center">
        {t('pricing.transparency.stripe')}
      </Text>
    </Stack>
  );
}
