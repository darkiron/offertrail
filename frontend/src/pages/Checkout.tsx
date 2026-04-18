import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Badge, Box, Button, Divider, List, Loader, Paper,
  Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import { IconCheck, IconCreditCard, IconX } from '@tabler/icons-react';
import { axiosInstance } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paymentResult = searchParams.get('payment');

  useEffect(() => {
    document.title = 'Activer votre abonnement — OfferTrail';
  }, []);

  // Déjà actif → redirect direct
  useEffect(() => {
    if (profile?.subscription_status === 'active') {
      navigate('/app', { replace: true });
    }
  }, [profile, navigate]);

  // Polling après retour Stripe success
  useEffect(() => {
    if (paymentResult !== 'success') return;

    setPolling(true);
    pollRef.current = setInterval(async () => {
      await refreshProfile();
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentResult, refreshProfile]);

  // Stop polling quand actif
  useEffect(() => {
    if (profile?.subscription_status === 'active' && pollRef.current) {
      clearInterval(pollRef.current);
      navigate('/app', { replace: true });
    }
  }, [profile, navigate]);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.post<{ checkout_url: string | null; mode: string }>(
        '/subscription/checkout',
      );
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        // Mode simulé (local sans Stripe)
        await refreshProfile();
        navigate('/app', { replace: true });
      }
    } catch {
      setError("Impossible d'initialiser le paiement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--mantine-color-body)',
      }}
    >
      <Paper p="xl" radius="xl" withBorder w="100%" maw={480} shadow="md">
        <Stack gap="xl">
          {/* Header */}
          <Stack gap="xs" ta="center">
            <Badge size="lg" variant="light" color="green" mx="auto">Pro — 14,99€/mois</Badge>
            <Title order={2} fw={900}>Activez votre abonnement</Title>
            <Text c="dimmed" size="sm">
              Bienvenue sur OfferTrail. Un abonnement est requis pour accéder à l&apos;application.
            </Text>
          </Stack>

          {/* Features */}
          <List
            spacing="xs"
            size="sm"
            icon={
              <ThemeIcon color="green" size={20} radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>Candidatures illimitées</List.Item>
            <List.Item>Suivi des entreprises et contacts</List.Item>
            <List.Item>Relances et historique complet</List.Item>
            <List.Item>Score de probité des entreprises</List.Item>
            <List.Item>Résiliable à tout moment</List.Item>
          </List>

          <Divider />

          {/* Alerts */}
          {paymentResult === 'success' && polling && (
            <Alert color="green" icon={<Loader size="xs" />}>
              Paiement reçu — activation en cours…
            </Alert>
          )}

          {paymentResult === 'cancelled' && (
            <Alert color="orange" icon={<IconX size={16} />}>
              Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
            </Alert>
          )}

          {error && <Alert color="red">{error}</Alert>}

          {/* CTA */}
          <Button
            size="lg"
            color="green"
            radius="xl"
            leftSection={<IconCreditCard size={18} />}
            loading={loading || polling}
            onClick={() => void handleCheckout()}
            fullWidth
          >
            {polling ? 'Activation en cours…' : 'Payer 14,99€ / mois'}
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            Paiement sécurisé via Stripe. Aucune carte stockée chez nous.
          </Text>
        </Stack>
      </Paper>
    </Box>
  );
}
