import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Checkbox,
  Group,
  List,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';
import { Button } from '../components/atoms/Button';

type PlanId = 'free' | 'pro' | 'ultimate';
type Period = 'monthly' | 'yearly';

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, ultimate: 2 };

const PLANS: Array<{
  id: PlanId;
  name: string;
  prices: Partial<Record<Period, string>>;
  features: string[];
}> = [
  {
    id: 'free',
    name: 'Free',
    prices: { monthly: '0€' },
    features: [
      '5 candidatures',
      'Dashboard basique',
      '1 relance active',
      'Historique 1 mois',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    prices: { monthly: '9,99€/mois', yearly: '99€/an' },
    features: [
      '100 candidatures',
      'KPIs avancés',
      'Import/Export CSV',
      '10 relances actives',
      'Historique 6 mois',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    prices: { monthly: '14,99€/mois', yearly: '149€/an' },
    features: [
      'Candidatures illimitées',
      'Score de probité complet',
      'Timeline détaillée',
      'Relances illimitées',
      'Historique illimité',
      'Support prioritaire',
    ],
  },
];

export function Pricing() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    document.title = 'Tarifs — OfferTrail';
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, []);

  const currentPlan = useMemo<PlanId>(() => {
    if (sub?.plan === 'pro' || sub?.plan === 'ultimate') {
      return sub.plan;
    }
    return 'free';
  }, [sub]);

  const handleCheckout = async (plan: Exclude<PlanId, 'free'>) => {
    setLoadingPlan(plan);
    try {
      const checkout = await subscriptionService.checkout({
        plan,
        period,
        coupon: promoCode.trim() || undefined,
      });

      if (checkout.mode === 'stripe' && checkout.checkout_url) {
        window.location.assign(checkout.checkout_url);
        return;
      }

      const updated = await subscriptionService.getMe();
      setSub(updated);
      notifications.show({ message: 'Plan activé.', color: 'green' });
    } catch {
      notifications.show({ message: "Impossible d'initialiser le paiement.", color: 'red' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderAction = (plan: PlanId) => {
    if (plan === currentPlan) {
      return <Button variant="secondary" disabled fullWidth>Plan actuel</Button>;
    }

    if (plan === 'free') {
      return currentPlan === 'free'
        ? <Button variant="secondary" disabled fullWidth>Plan actuel</Button>
        : <Button variant="secondary" disabled fullWidth>Downgrade</Button>;
    }

    if (PLAN_RANK[plan] < PLAN_RANK[currentPlan]) {
      return <Button variant="secondary" disabled fullWidth>Downgrade</Button>;
    }

    return (
      <Button
        variant="primary"
        onClick={() => void handleCheckout(plan)}
        disabled={!cgvAccepted || loadingPlan !== null}
        loading={loadingPlan === plan}
        fullWidth
      >
        {loadingPlan === plan ? 'Redirection...' : 'Essayer gratuitement 30 jours'}
      </Button>
    );
  };

  return (
    <Stack gap="xl" p="lg" maw={1120} mx="auto">
      <Group justify="space-between" align="flex-start">
        <Stack gap={6}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">Tarifs</Text>
          <Title order={1}>Choisis le plan adapté à ton volume de candidatures</Title>
          <Text c="dimmed" maw={680}>
            Trois plans lisibles, un premier mois offert sur Pro et Ultimate, et les promotions gérées par coupons Stripe.
          </Text>
        </Stack>
        <Button variant="ghost" onClick={() => navigate(-1)}>Retour</Button>
      </Group>

      <SegmentedControl
        data={[
          { label: 'Mensuel', value: 'monthly' },
          { label: 'Annuel (-17%)', value: 'yearly' },
        ]}
        value={period}
        onChange={(value) => setPeriod(value as Period)}
        w="fit-content"
      />

      <TextInput
        label="Code promo"
        placeholder="LAUNCH2026"
        value={promoCode}
        onChange={(event) => setPromoCode(event.currentTarget.value.toUpperCase())}
        maw={260}
      />

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        {PLANS.map((plan) => {
          const highlighted = (plan.id === 'pro' && period === 'monthly') || (plan.id === 'ultimate' && period === 'yearly');
          const badge = plan.id === 'pro' && period === 'monthly'
            ? 'POPULAIRE'
            : plan.id === 'ultimate' && period === 'yearly'
              ? 'MEILLEUR RAPPORT'
              : null;

          return (
            <Paper
              key={plan.id}
              p="xl"
              radius="md"
              withBorder
              style={{
                borderColor: highlighted ? 'var(--mantine-color-blue-5)' : undefined,
                boxShadow: highlighted ? '0 18px 40px rgba(37, 99, 235, 0.14)' : undefined,
              }}
            >
              <Stack gap="lg" h="100%">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text size="xs" fw={800} tt="uppercase" c="dimmed">{plan.name}</Text>
                    <Title order={2}>{plan.prices[plan.id === 'free' ? 'monthly' : period]}</Title>
                  </Stack>
                  {badge ? <Badge color={plan.id === 'pro' ? 'blue' : 'violet'}>{badge}</Badge> : null}
                </Group>

                <List spacing="sm" size="sm" c="dimmed">
                  {plan.features.map((feature) => (
                    <List.Item key={feature}>{feature}</List.Item>
                  ))}
                </List>

                {plan.id !== 'free' ? (
                  <Badge variant="light" color="green" w="fit-content">Premier mois offert</Badge>
                ) : null}

                <Stack gap="md" mt="auto">
                  {plan.id !== 'free' ? (
                    <Checkbox
                      label={(
                        <span style={{ fontSize: '12px', lineHeight: '1.6' }}>
                          J&apos;accepte les <a href="/app/legal/cgv" target="_blank" rel="noreferrer">CGV</a> et
                          je renonce à mon droit de rétractation de 14 jours conformément à l&apos;article L221-28 du Code de la consommation,
                          le service étant accessible immédiatement.
                        </span>
                      )}
                      checked={cgvAccepted}
                      onChange={(event) => setCgvAccepted(event.currentTarget.checked)}
                      required
                    />
                  ) : null}
                  {renderAction(plan.id)}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>

      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text size="xs" fw={800} tt="uppercase" c="dimmed">Transparence prix</Text>
              <Title order={3}>Ce que finance l&apos;abonnement</Title>
            </Stack>
            <Badge variant="light">CraftCodes</Badge>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {[
              ['URSSAF et charges', 'Cotisations, taxes et cadre administratif du service.'],
              ['Stripe', 'Paiement sécurisé, facturation et gestion des abonnements.'],
              ['Produit', 'Développement, hébergement, maintenance et support CraftCodes.'],
            ].map(([title, description]) => (
              <Stack key={title} gap={4}>
                <Text fw={700}>{title}</Text>
                <Text size="sm" c="dimmed">{description}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
}
