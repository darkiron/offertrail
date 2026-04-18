import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Badge, Button, Group, Modal, Paper, SimpleGrid,
  Skeleton, Stack, Table, Text, TextInput, Title,
} from '@mantine/core';
import {
  BarChart, Bar,
  CartesianGrid,
  LineChart, Line,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconRefresh, IconSearch } from '@tabler/icons-react';
import { axiosInstance } from '../services/api';
import classes from './Admin.module.css';

const accentColor  = 'var(--mantine-color-blue-6)';
const successColor = 'var(--mantine-color-green-6)';
const warningColor = 'var(--mantine-color-orange-5)';
const dangerColor  = 'var(--mantine-color-red-6)';

const TICK  = { fill: 'var(--mantine-color-dimmed)', fontSize: 11 } as const;
const GRID  = { stroke: 'var(--mantine-color-default-border)', strokeDasharray: '3 3' } as const;
const TT_STYLE = {
  background: 'var(--mantine-color-body)',
  border: '1px solid var(--mantine-color-default-border)',
  borderRadius: 8,
  color: 'var(--mantine-color-text)',
  fontSize: 12,
} as const;
const LEGEND_STYLE = { color: 'var(--mantine-color-text)', fontSize: 12 } as const;

interface AdminStats {
  mrr: number;
  arr: number;
  total_users: number;
  active_users: number;
  pending_users: number;
  cancelled_users: number;
  new_users_30d: number;
  activation_rate: number;
  churn_rate: number;
  total_candidatures: number;
  avg_cands_per_user: number;
}

interface AdminUserRow {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  subscription_status: string;
  role: string;
  is_active: boolean;
  nb_candidatures: number;
  created_at: string | null;
  plan_started_at: string | null;
}

interface MrrPoint {
  month: string;
  mrr: number;
  active_users: number;
}

interface SignupPoint {
  date: string;
  signups: number;
  paid: number;
}

interface CandPoint {
  date: string;
  count: number;
}

interface Funnel {
  total: number;
  pending: number;
  active: number;
  cancelled: number;
  churn_rate: number;
  activation_rate: number;
}

const defaultStats: AdminStats = {
  mrr: 0, arr: 0, total_users: 0, active_users: 0,
  pending_users: 0, cancelled_users: 0, new_users_30d: 0,
  activation_rate: 0, churn_rate: 0, total_candidatures: 0,
  avg_cands_per_user: 0,
};

const defaultFunnel: Funnel = {
  total: 0, pending: 0, active: 0, cancelled: 0, churn_rate: 0, activation_rate: 0,
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('fr-FR');
}

function statusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    active:    { color: 'green',  label: 'Actif' },
    pending:   { color: 'orange', label: 'En attente' },
    cancelled: { color: 'red',    label: 'Résilié' },
  };
  const entry = map[status] ?? { color: 'gray', label: status };
  return <Badge variant="light" color={entry.color} size="sm">{entry.label}</Badge>;
}

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <Paper p="lg" radius="lg" withBorder>
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">{label}</Text>
      <Text size="xl" fw={900} mt={4} c={color} className={classes.statsValue}>{value}</Text>
      {sub && <Text size="xs" c="dimmed" mt={2}>{sub}</Text>}
    </Paper>
  );
}

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState<AdminStats>(defaultStats);
  const [users, setUsers]       = useState<AdminUserRow[]>([]);
  const [funnel, setFunnel]     = useState<Funnel>(defaultFunnel);
  const [mrrData, setMrrData]   = useState<MrrPoint[]>([]);
  const [signups, setSignups]   = useState<SignupPoint[]>([]);
  const [cands, setCands]       = useState<CandPoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [accessDenied, setAccessDenied]   = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  useEffect(() => { document.title = 'Administration — OfferTrail'; }, []);

  const handle403 = (err: unknown): boolean => {
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      setAccessDenied(true);
      window.setTimeout(() => navigate('/app', { replace: true }), 1500);
      return true;
    }
    return false;
  };

  const refresh = async () => {
    const [s, u] = await Promise.all([
      axiosInstance.get<AdminStats>('/admin/stats'),
      axiosInstance.get<AdminUserRow[]>('/admin/users'),
    ]);
    setStats(s.data);
    setUsers(u.data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes] = await Promise.all([
          axiosInstance.get<AdminStats>('/admin/stats'),
          axiosInstance.get<AdminUserRow[]>('/admin/users'),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        if (handle403(err)) return;
        notifications.show({ title: 'Erreur', message: 'Impossible de charger le backoffice.', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [navigate]);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        setChartsLoading(true);
        const [mrrRes, signupsRes, candsRes, funnelRes] = await Promise.all([
          axiosInstance.get<MrrPoint[]>('/admin/analytics/mrr-history'),
          axiosInstance.get<SignupPoint[]>('/admin/analytics/signups'),
          axiosInstance.get<CandPoint[]>('/admin/analytics/candidatures-evolution'),
          axiosInstance.get<Funnel>('/admin/analytics/funnel'),
        ]);
        setMrrData(mrrRes.data);
        setSignups(signupsRes.data);
        setCands(candsRes.data);
        setFunnel(funnelRes.data);
      } catch (err) {
        if (handle403(err)) return;
      } finally {
        setChartsLoading(false);
      }
    };
    void loadCharts();
  }, [navigate]);

  const handleStatusChange = async (userId: string, status: 'active' | 'cancelled' | 'pending') => {
    try {
      setPendingAction(`${userId}:${status}`);
      await axiosInstance.patch(`/admin/users/${userId}/status`, { subscription_status: status });
      await refresh();
      notifications.show({ message: `Statut mis à jour.`, color: 'green' });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: "Impossible de mettre à jour le statut.", color: 'red' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      setPendingAction(`${userId}:toggle`);
      await axiosInstance.patch(`/admin/users/${userId}/toggle-active`);
      await refresh();
      notifications.show({ message: 'Compte mis à jour.', color: 'blue' });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: 'Impossible de modifier le statut.', color: 'red' });
    } finally {
      setPendingAction(null);
      setConfirmUserId(null);
    }
  };

  const handleRecomputeProbite = async () => {
    try {
      setPendingAction('probite');
      const res = await axiosInstance.post<{ updated: number }>('/admin/recompute-probite');
      notifications.show({
        title: 'Probité recalculée',
        message: `${res.data.updated} établissements mis à jour.`,
        color: 'green',
      });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: 'Erreur lors du recalcul.', color: 'red' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await axiosInstance.get('/admin/export-users', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offertrail-users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: 'Erreur export CSV.', color: 'red' });
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.email ?? '').toLowerCase().includes(q) ||
      [u.prenom, u.nom].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [users, search]);

  const activeCount  = users.filter((u) => u.is_active).length;
  const confirmUser  = confirmUserId ? users.find((u) => u.id === confirmUserId) : null;

  // Pie data for funnel
  const pieData = [
    { name: 'Actifs',       value: funnel.active,    color: successColor },
    { name: 'En attente',   value: funnel.pending,   color: warningColor },
    { name: 'Résiliés',     value: funnel.cancelled, color: dangerColor  },
  ].filter((d) => d.value > 0);

  if (accessDenied) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Alert color="red">Accès refusé. Redirection en cours.</Alert>
      </Stack>
    );
  }

  return (
    <>
      <Modal
        opened={!!confirmUserId}
        onClose={() => setConfirmUserId(null)}
        title="Confirmer la désactivation"
        size="sm"
        centered
      >
        <Text size="sm" mb="lg">
          Désactiver <strong>{confirmUser?.email ?? confirmUser?.id}</strong> ?
          L&apos;utilisateur ne pourra plus se connecter.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setConfirmUserId(null)}>Annuler</Button>
          <Button
            color="red"
            loading={pendingAction === `${confirmUserId}:toggle`}
            onClick={() => confirmUserId && void handleToggleActive(confirmUserId)}
          >
            Désactiver
          </Button>
        </Group>
      </Modal>

      <Stack gap="xl" p="lg" className={classes.shell}>
        {/* Hero */}
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <span className={classes.kicker}>Admin</span>
          <h1 className={classes.heroTitle}>Tableau de bord administrateur</h1>
          <Text c="dimmed">
            Vue globale des comptes, du parc d&apos;abonnements et des actions de support.
          </Text>
        </Paper>

        {/* ── Zone 1 — KPI Cards ── */}
        <div>
          <Title order={4} mb="md" c="dimmed" tt="uppercase" fz="xs" fw={700} ls="0.06em">
            Vue d&apos;ensemble
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} height={100} radius="lg" />)
              : [
                  { label: 'MRR', value: `${stats.mrr.toFixed(2)} €`, sub: `ARR : ${stats.arr.toFixed(2)} €`, color: 'green' },
                  { label: 'Abonnés actifs', value: String(stats.active_users), sub: `${stats.activation_rate} % activation` },
                  { label: 'Taux d\'activation', value: `${stats.activation_rate} %`, sub: `+${stats.new_users_30d} inscrits 30j` },
                  { label: 'Churn mensuel', value: `${stats.churn_rate} %`, sub: `${stats.cancelled_users} résiliés` },
                ].map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </SimpleGrid>
        </div>

        {/* ── Zone 2 — Graphiques ── */}
        <div>
          <Title order={4} mb="md" c="dimmed" tt="uppercase" fz="xs" fw={700} ls="0.06em">
            Analytiques
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* MRR 12 mois */}
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">MRR — 12 derniers mois</Text>
              {chartsLoading ? <Skeleton height={220} radius="md" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={mrrData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="month" tick={TICK} />
                    <YAxis tick={TICK} />
                    <Tooltip contentStyle={TT_STYLE} formatter={(v) => [`${Number(v).toFixed(2)} €`, 'MRR']} />
                    <Line type="monotone" dataKey="mrr" stroke={accentColor} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Paper>

            {/* Inscriptions vs Paiements 30j */}
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Inscriptions vs Paiements — 30j</Text>
              {chartsLoading ? <Skeleton height={220} radius="md" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={signups} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="date" tick={TICK} interval={4} />
                    <YAxis tick={TICK} allowDecimals={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Line type="monotone" dataKey="signups" stroke={accentColor} strokeWidth={2} dot={false} name="Inscrits" />
                    <Line type="monotone" dataKey="paid" stroke={successColor} strokeWidth={2} dot={false} name="Payants" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Paper>

            {/* Candidatures 30j */}
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Candidatures créées — 30j</Text>
              {chartsLoading ? <Skeleton height={220} radius="md" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cands} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="date" tick={TICK} interval={4} />
                    <YAxis tick={TICK} allowDecimals={false} />
                    <Tooltip contentStyle={TT_STYLE} />
                    <Bar dataKey="count" fill={accentColor} name="Candidatures" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>

            {/* Funnel Pie */}
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">
                Entonnoir — Activation {funnel.activation_rate} % · Churn {funnel.churn_rate} %
              </Text>
              {chartsLoading ? <Skeleton height={220} radius="md" /> : pieData.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" mt="xl">Aucune donnée</Text>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </SimpleGrid>
        </div>

        {/* ── Zone 3 — Gestion utilisateurs ── */}
        <Paper p="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Stack gap={2}>
              <Title order={3}>Liste des utilisateurs</Title>
              <Text size="sm" c="dimmed">{activeCount} comptes actifs sur {users.length}</Text>
            </Stack>
            <Group gap="sm" wrap="wrap">
              <TextInput
                placeholder="Rechercher par email..."
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                w={220}
              />
              <Button
                variant="light"
                color="green"
                leftSection={<IconDownload size={14} />}
                onClick={() => void handleExportCsv()}
              >
                Exporter CSV
              </Button>
              <Button
                variant="light"
                leftSection={<IconRefresh size={14} />}
                loading={pendingAction === 'probite'}
                onClick={() => void handleRecomputeProbite()}
              >
                Recalculer probité
              </Button>
            </Group>
          </Group>

          <Table.ScrollContainer minWidth={960}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Rôle</Table.Th>
                  <Table.Th>Candidatures</Table.Th>
                  <Table.Th>Inscrit le</Table.Th>
                  <Table.Th>Payé le</Table.Th>
                  <Table.Th>Compte</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <Table.Tr key={i}>
                      {[...Array(8)].map((__, j) => (
                        <Table.Td key={j}><Skeleton height={14} /></Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} style={{ textAlign: 'center' }}>
                      <Text c="dimmed">Aucun utilisateur.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredUsers.map((user) => (
                    <Table.Tr key={user.id} opacity={user.is_active ? 1 : 0.55}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={700} size="sm">{user.email ?? '—'}</Text>
                          <Text c="dimmed" size="xs">
                            {[user.prenom, user.nom].filter(Boolean).join(' ') || 'Sans nom'}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{statusBadge(user.subscription_status)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.role === 'admin' ? 'yellow' : 'gray'} size="sm">
                          {user.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{user.nb_candidatures}</Table.Td>
                      <Table.Td>{formatDate(user.created_at)}</Table.Td>
                      <Table.Td>{formatDate(user.plan_started_at)}</Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={user.is_active ? 'green' : 'red'}
                          size="sm"
                        >
                          {user.is_active ? 'actif' : 'désactivé'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          {user.subscription_status !== 'active' ? (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              loading={pendingAction === `${user.id}:active`}
                              disabled={!!pendingAction || !user.is_active}
                              onClick={() => void handleStatusChange(user.id, 'active')}
                            >
                              Activer
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="light"
                              color="orange"
                              loading={pendingAction === `${user.id}:cancelled`}
                              disabled={!!pendingAction || !user.is_active}
                              onClick={() => void handleStatusChange(user.id, 'cancelled')}
                            >
                              Révoquer
                            </Button>
                          )}
                          {user.is_active ? (
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              disabled={!!pendingAction}
                              onClick={() => setConfirmUserId(user.id)}
                            >
                              Désactiver
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="light"
                              color="teal"
                              loading={pendingAction === `${user.id}:toggle`}
                              disabled={!!pendingAction}
                              onClick={() => void handleToggleActive(user.id)}
                            >
                              Réactiver
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>
    </>
  );
}
