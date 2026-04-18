import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Badge, Button, Group, Modal, Paper, Progress,
  SimpleGrid, Skeleton, Stack, Table, Text, TextInput, Title,
} from '@mantine/core';
import { AreaChart, BarChart, DonutChart, LineChart } from '@mantine/charts';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconRefresh, IconSearch } from '@tabler/icons-react';
import { axiosInstance } from '../services/api';
import classes from './Admin.module.css';

interface AdminStats {
  mrr: number;
  arr: number;
  total_users: number;
  pro_users: number;
  free_users: number;
  new_users_7d: number;
  new_users_30d: number;
  new_pro_30d: number;
  conversion_rate: number;
  churn_rate_30d: number;
  total_candidatures: number;
  avg_cands_per_user: number;
  total_relances: number;
  total_etablissements: number;
  active_users_7d: number;
}

interface AdminUserRow {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  plan: string;
  role: string;
  is_active: boolean;
  nb_candidatures: number;
  created_at: string | null;
  plan_started_at: string | null;
}

interface ActivityEntry {
  email: string | null;
  created_at?: string | null;
  plan_started_at?: string | null;
}

interface AdminActivity {
  new_users: ActivityEntry[];
  new_pro: ActivityEntry[];
}

interface ChartPoint {
  date: string;
  mrr?: number;
  signups?: number;
  candidatures?: number;
}

interface PlanSlice {
  plan: string;
  count: number;
  color: string;
}

interface TopEtab {
  nom: string;
  total: number;
}

const defaultStats: AdminStats = {
  mrr: 0, arr: 0, total_users: 0, pro_users: 0, free_users: 0,
  new_users_7d: 0, new_users_30d: 0, new_pro_30d: 0, conversion_rate: 0,
  churn_rate_30d: 0, total_candidatures: 0, avg_cands_per_user: 0,
  total_relances: 0, total_etablissements: 0, active_users_7d: 0,
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('fr-FR');
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return '-';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function KpiCard({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Paper p="lg" radius="lg" withBorder>
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">{label}</Text>
      <Text size="xl" fw={900} mt={4} c={accent} className={classes.statsValue}>{value}</Text>
      {sub && <Text size="xs" c="dimmed" mt={2}>{sub}</Text>}
    </Paper>
  );
}

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [activity, setActivity] = useState<AdminActivity>({ new_users: [], new_pro: [] });
  const [mrrData, setMrrData] = useState<ChartPoint[]>([]);
  const [signupsData, setSignupsData] = useState<ChartPoint[]>([]);
  const [activityData, setActivityData] = useState<ChartPoint[]>([]);
  const [planDist, setPlanDist] = useState<PlanSlice[]>([]);
  const [topEtabs, setTopEtabs] = useState<TopEtab[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
        const [statsRes, usersRes, activityRes] = await Promise.all([
          axiosInstance.get<AdminStats>('/admin/stats'),
          axiosInstance.get<AdminUserRow[]>('/admin/users'),
          axiosInstance.get<AdminActivity>('/admin/activity'),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setActivity(activityRes.data);
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
        const [mrrRes, signupsRes, actRes, distRes, topRes] = await Promise.all([
          axiosInstance.get<ChartPoint[]>('/admin/chart/mrr-evolution'),
          axiosInstance.get<ChartPoint[]>('/admin/chart/users-growth'),
          axiosInstance.get<ChartPoint[]>('/admin/chart/candidatures-activity'),
          axiosInstance.get<PlanSlice[]>('/admin/chart/plan-distribution'),
          axiosInstance.get<TopEtab[]>('/admin/top-etablissements'),
        ]);
        setMrrData(mrrRes.data.map((p) => ({ ...p, date: formatDateShort(p.date) })));
        setSignupsData(signupsRes.data.map((p) => ({ ...p, date: formatDateShort(p.date) })));
        setActivityData(actRes.data.map((p) => ({ ...p, date: formatDateShort(p.date) })));
        setPlanDist(distRes.data);
        setTopEtabs(topRes.data);
      } catch (err) {
        if (handle403(err)) return;
      } finally {
        setChartsLoading(false);
      }
    };
    void loadCharts();
  }, [navigate]);

  const handlePlanChange = async (userId: string, plan: 'free' | 'pro') => {
    try {
      setPendingAction(`${userId}:${plan}`);
      await axiosInstance.patch(`/admin/users/${userId}/plan`, { plan });
      await refresh();
      notifications.show({ message: `Plan mis à jour : ${plan === 'pro' ? 'Pro' : 'Gratuit'}`, color: 'green' });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: "Impossible de mettre à jour l'abonnement.", color: 'red' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      setPendingAction(`${userId}:toggle`);
      await axiosInstance.patch(`/admin/users/${userId}/toggle-active`);
      await refresh();
      notifications.show({ message: 'Statut mis à jour.', color: 'blue' });
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

  const activeCount = users.filter((u) => u.is_active).length;
  const confirmUser = confirmUserId ? users.find((u) => u.id === confirmUserId) : null;
  const maxEtabTotal = topEtabs[0]?.total ?? 1;

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

        {/* ── Section A — 4 KPI cards ── */}
        <div>
          <Title order={4} mb="md" c="dimmed" tt="uppercase" fz="xs" fw={700} ls="0.06em">
            Vue d&apos;ensemble
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} height={100} radius="lg" />)
              : [
                  {
                    label: 'MRR',
                    value: `${stats.mrr.toFixed(2)} €`,
                    sub: `ARR : ${stats.arr.toFixed(2)} €`,
                    accent: 'green' as const,
                  },
                  {
                    label: 'Users total',
                    value: String(stats.total_users),
                    sub: `+${stats.new_users_30d} sur 30j`,
                  },
                  {
                    label: 'Conversion',
                    value: `${stats.conversion_rate} %`,
                    sub: `${stats.pro_users} Pro / ${stats.total_users} users`,
                  },
                  {
                    label: 'Moy. candidatures',
                    value: String(stats.avg_cands_per_user),
                    sub: `${stats.total_candidatures} total`,
                  },
                ].map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
          </SimpleGrid>
        </div>

        {/* ── Section B — Graphiques ── */}
        <div>
          <Title order={4} mb="md" c="dimmed" tt="uppercase" fz="xs" fw={700} ls="0.06em">
            Analytiques
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Évolution MRR — 90 jours</Text>
              {chartsLoading
                ? <Skeleton height={280} radius="md" />
                : (
                  <LineChart
                    h={280}
                    data={mrrData}
                    dataKey="date"
                    series={[{ name: 'mrr', color: 'green.6', label: 'MRR (€)' }]}
                    withLegend
                    withTooltip
                    curveType="monotone"
                  />
                )}
            </Paper>

            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Nouveaux inscrits — 30 jours</Text>
              {chartsLoading
                ? <Skeleton height={280} radius="md" />
                : (
                  <BarChart
                    h={280}
                    data={signupsData}
                    dataKey="date"
                    series={[{ name: 'signups', color: 'blue.6', label: 'Inscriptions' }]}
                    withLegend
                  />
                )}
            </Paper>

            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Activité candidatures — 30 jours</Text>
              {chartsLoading
                ? <Skeleton height={240} radius="md" />
                : (
                  <AreaChart
                    h={240}
                    data={activityData}
                    dataKey="date"
                    series={[{ name: 'candidatures', color: 'violet.6', label: 'Candidatures' }]}
                    curveType="monotone"
                    withTooltip
                  />
                )}
            </Paper>

            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} mb="sm">Répartition des plans</Text>
              {chartsLoading
                ? <Skeleton height={240} radius="md" />
                : planDist.every((s) => s.count === 0)
                  ? <Text c="dimmed" size="sm" mt="xl" ta="center">Aucune donnée</Text>
                  : (
                    <DonutChart
                      data={planDist.map((s) => ({ name: s.plan, value: s.count, color: s.color }))}
                      h={240}
                      withLabelsLine
                      withLabels
                      withTooltip
                    />
                  )}
            </Paper>
          </SimpleGrid>
        </div>

        {/* ── Section C — Tables analytiques ── */}
        <div>
          <Title order={4} mb="md" c="dimmed" tt="uppercase" fz="xs" fw={700} ls="0.06em">
            Classements & activité récente
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Top établissements */}
            <Paper p="lg" radius="lg" withBorder>
              <Title order={5} mb="md">Top 10 établissements</Title>
              {chartsLoading ? <Skeleton height={220} /> : (
                <Stack gap="xs">
                  {topEtabs.length === 0
                    ? <Text c="dimmed" size="sm">Aucune donnée</Text>
                    : topEtabs.map((e, i) => (
                        <div key={e.nom}>
                          <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={500}>
                              <Text span c="dimmed" size="xs" mr={6}>{i + 1}.</Text>
                              {e.nom}
                            </Text>
                            <Text size="xs" c="dimmed">{e.total}</Text>
                          </Group>
                          <Progress
                            value={(e.total / maxEtabTotal) * 100}
                            size="xs"
                            color="violet"
                            radius="xl"
                          />
                        </div>
                      ))}
                </Stack>
              )}
            </Paper>

            {/* Activité récente */}
            <Paper p="lg" radius="lg" withBorder>
              <Title order={5} mb="md">Activité récente</Title>
              {loading ? <Skeleton height={220} /> : (
                <Stack gap="md">
                  <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">Derniers inscrits</Text>
                    <Stack gap="xs">
                      {activity.new_users.length === 0
                        ? <Text c="dimmed" size="sm">Aucun</Text>
                        : activity.new_users.map((u, i) => (
                            <Group key={i} justify="space-between">
                              <Text size="sm" fw={500}>{u.email ?? '—'}</Text>
                              <Text size="xs" c="dimmed">{formatRelative(u.created_at)}</Text>
                            </Group>
                          ))}
                    </Stack>
                  </div>
                  <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">Derniers upgrades Pro</Text>
                    <Stack gap="xs">
                      {activity.new_pro.length === 0
                        ? <Text c="dimmed" size="sm">Aucun</Text>
                        : activity.new_pro.map((u, i) => (
                            <Group key={i} justify="space-between">
                              <Text size="sm" fw={500}>{u.email ?? '—'}</Text>
                              <Text size="xs" c="dimmed">{formatRelative(u.plan_started_at)}</Text>
                            </Group>
                          ))}
                    </Stack>
                  </div>
                </Stack>
              )}
            </Paper>
          </SimpleGrid>
        </div>

        {/* ── Section D — Gestion utilisateurs ── */}
        <Paper p="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Stack gap={2}>
              <Title order={3}>Liste des utilisateurs</Title>
              <Text size="sm" c="dimmed">{activeCount} actifs sur {users.length} comptes</Text>
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

          <Table.ScrollContainer minWidth={920}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Plan</Table.Th>
                  <Table.Th>Rôle</Table.Th>
                  <Table.Th>Candidatures</Table.Th>
                  <Table.Th>Inscrit le</Table.Th>
                  <Table.Th>Plan démarré</Table.Th>
                  <Table.Th>Actif</Table.Th>
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
                            {[user.prenom, user.nom].filter(Boolean).join(' ') || 'Profil sans nom'}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.plan === 'pro' ? 'green' : 'gray'} size="sm">
                          {user.plan === 'pro' ? 'Pro' : 'Gratuit'}
                        </Badge>
                      </Table.Td>
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
                          {user.plan !== 'pro' ? (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              loading={pendingAction === `${user.id}:pro`}
                              disabled={!!pendingAction || !user.is_active}
                              onClick={() => void handlePlanChange(user.id, 'pro')}
                            >
                              Passer Pro
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="light"
                              color="gray"
                              loading={pendingAction === `${user.id}:free`}
                              disabled={!!pendingAction || !user.is_active}
                              onClick={() => void handlePlanChange(user.id, 'free')}
                            >
                              Passer en Gratuit
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
