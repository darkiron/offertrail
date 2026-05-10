import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Group, List, Paper, Stack, Text, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';
import { useI18n } from '../i18n';

export function Pricing() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const transparencyRows = useMemo(() => [
    { label: t('pricing.row1Label'), value: t('pricing.row1Value') },
    { label: t('pricing.row2Label'), value: t('pricing.row2Value') },
    { label: t('pricing.row3Label'), value: t('pricing.row3Value') },
  ], [t]);

  useEffect(() => {
    document.title = t('pricing.pageTitle');
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
      notifications.show({ message: checkout.message || t('pricing.successMessage'), color: 'green' });
    } catch {
      notifications.show({ message: t('pricing.error'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="lg" maw={520} mx="auto">
      <Group>
        <Button variant="ghost" onClick={() => navigate(-1)}>{t('pricing.back')}</Button>
        <Title order={2}>{t('pricing.title')}</Title>
      </Group>

      {sub ? (
        <Text c="dimmed" size="sm">
          {t('pricing.currentPlan')} <strong>{sub.is_active ? t('pricing.planActive') : t('pricing.planNone')}</strong>
        </Text>
      ) : null}

      <Paper p="xl" radius="lg" withBorder style={{ borderColor: 'rgba(14, 165, 233, 0.35)' }}>
        <Group justify="space-between" align="flex-start" mb="lg">
          <Stack gap={4}>
            <Text size="xs" fw={500} tt="uppercase" ls="0.08em" c="dimmed">{t('pricing.planActive')}</Text>
            <Text size="xl" fw={500}>
              {t('pricing.price')}
              <Text component="span" size="sm" fw={400} c="dimmed">{t('pricing.perMonth')}</Text>
            </Text>
          </Stack>
          {sub?.is_active ? (
            <Badge variant="light" color="green" size="sm">{t('pricing.badgeActive')}</Badge>
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
            t('pricing.feature1'),
            t('pricing.feature2'),
            t('pricing.feature3'),
            t('pricing.feature4'),
            t('pricing.feature5'),
          ].map((feature) => (
            <List.Item key={feature}>{feature}</List.Item>
          ))}
        </List>

        {sub?.is_active ? (
          <Text size="sm" c="dimmed">
            {t('pricing.activeSince')}{' '}
            {sub.plan_started_at
              ? new Date(sub.plan_started_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')
              : '-'}
          </Text>
        ) : (
          <Button variant="primary" onClick={handleUpgrade} disabled={loading}>
            {loading ? t('pricing.loading') : t('pricing.submit')}
          </Button>
        )}
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        <Stack gap="sm">
          <Text size="xs" fw={500} tt="uppercase" ls="0.08em" c="dimmed">
            {t('pricing.transparencyTitle')}
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
            {t('pricing.transparencyDesc')}
          </Text>
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed" ta="center">
        {t('pricing.securePayment')}
      </Text>
    </Stack>
  );
}
