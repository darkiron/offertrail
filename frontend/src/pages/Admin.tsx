import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title,
} from '@mantine/core';
import { axiosInstance } from '../services/api';
import classes from './Admin.module.css';

interface AdminStats {
  total_users: number;
  pro_users: number;
  starter_users: number;
  total_candidatures: number;
  mrr_estimate: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  plan: string;
  role: string;
  is_active: boolean;
  nb_candidatures: number;
  created_at: string | null;
  plan_started_at: string | null;
}

const defaultStats: AdminStats = {
  total_users: 0,
  pro_users: 0,
  starter_users: 0,
  total_candidatures: 0,
  mrr_estimate: 0,
};

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('fr-FR');
}

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => { document.title = 'Administration — OfferTrail'; }, []);


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsResponse, usersResponse] = await Promise.all([
          axiosInstance.get<AdminStats>('/admin/stats'),
          axiosInstance.get<AdminUserRow[]>('/admin/users'),
        ]);
        setStats(statsResponse.data);
        setUsers(usersResponse.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setAccessDenied(true);
          window.setTimeout(() => navigate('/app', { replace: true }), 1500);
          return;
        }
        setError('Impossible de charger le backoffice admin.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate]);

  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active),
    [users],
  );

  const refreshUsers = async () => {
    const [statsResponse, usersResponse] = await Promise.all([
      axiosInstance.get<AdminStats>('/admin/stats'),
      axiosInstance.get<AdminUserRow[]>('/admin/users'),
    ]);
    setStats(statsResponse.data);
    setUsers(usersResponse.data);
  };

  const handlePlanChange = async (userId: string, plan: 'starter' | 'pro') => {
    try {
      setPendingAction(`${userId}:${plan}`);
      setError(null);
      await axiosInstance.patch(`/admin/users/${userId}/plan`, { plan });
      await refreshUsers();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAccessDenied(true);
        window.setTimeout(() => navigate('/app', { replace: true }), 1500);
        return;
      }
      setError("Impossible de mettre à jour l'abonnement.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      setPendingAction(`${userId}:disable`);
      setError(null);
      await axiosInstance.delete(`/admin/users/${userId}`);
      await refreshUsers();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAccessDenied(true);
        window.setTimeout(() => navigate('/app', { replace: true }), 1500);
        return;
      }
      setError('Impossible de désactiver cet utilisateur.');
    } finally {
      setPendingAction(null);
    }
  };

  if (accessDenied) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Alert color="red">Accès refusé. Redirection en cours.</Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <span className={classes.kicker}>Admin</span>
        <h1 className={classes.heroTitle}>Tableau de bord administrateur</h1>
        <Text c="dimmed">
          Vue globale des comptes, du parc d&apos;abonnements et des actions de support.
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {[
          { label: 'Users total', value: stats.total_users },
          { label: 'Pro payants', value: stats.pro_users },
          { label: 'MRR estimé', value: `${stats.mrr_estimate.toFixed(2)} €` },
          { label: 'Candidatures total', value: stats.total_candidatures },
        ].map((item) => (
          <Paper key={item.label} p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.05em" c="dimmed">{item.label}</Text>
            <Text size="xl" fw={900} mt="xs" className={classes.statsValue}>
              {item.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper p="xl" radius="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Stack gap={2}>
            <Title order={3}>Liste des utilisateurs</Title>
            <Text size="sm" c="dimmed">{activeUsers.length} actifs sur {users.length} comptes</Text>
          </Stack>
        </Group>

        {error ? <Alert color="red" mb="md">{error}</Alert> : null}

        <Table.ScrollContainer minWidth={880}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Rôle</Table.Th>
                <Table.Th>Candidatures</Table.Th>
                <Table.Th>Inscrit le</Table.Th>
                <Table.Th>Plan démarré</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && users.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                    <Text c="dimmed">Aucun utilisateur.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}

              {users.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text fw={700} size="sm">{user.email}</Text>
                      <Text c="dimmed" size="xs">
                        {[user.prenom, user.nom].filter(Boolean).join(' ') || 'Profil sans nom'}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={user.plan === 'pro' ? 'green' : 'gray'} size="sm">
                      {user.plan}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="wrap">
                      <Badge variant="light" color={user.role === 'admin' ? 'yellow' : 'gray'} size="sm">
                        {user.role}
                      </Badge>
                      {!user.is_active ? (
                        <Badge variant="light" color="red" size="sm">désactivé</Badge>
                      ) : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>{user.nb_candidatures}</Table.Td>
                  <Table.Td>{formatDate(user.created_at)}</Table.Td>
                  <Table.Td>{formatDate(user.plan_started_at)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="wrap">
                      {user.plan !== 'pro' ? (
                        <Button
                          size="xs"
                          variant="light"
                          color="blue"
                          disabled={pendingAction === `${user.id}:pro` || !user.is_active}
                          onClick={() => void handlePlanChange(user.id, 'pro')}
                        >
                          Passer Pro
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          disabled={pendingAction === `${user.id}:starter` || !user.is_active}
                          onClick={() => void handlePlanChange(user.id, 'starter')}
                        >
                          Révoquer Pro
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        disabled={pendingAction === `${user.id}:disable` || !user.is_active}
                        onClick={() => void handleDeactivate(user.id)}
                      >
                        Désactiver
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  );
}
