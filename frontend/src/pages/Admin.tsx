import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconSearch } from '@tabler/icons-react';
import { axiosInstance } from '../services/api';
import classes from './Admin.module.css';

const COLORS = {
  free: 'var(--mantine-color-gray-6)',
  pro: 'var(--mantine-color-blue-6)',
  ultimate: 'var(--mantine-color-violet-6)',
  green: 'var(--mantine-color-green-6)',
};
const TICK = { fill: 'var(--mantine-color-dimmed)', fontSize: 11 } as const;
const GRID = { stroke: 'var(--mantine-color-default-border)', strokeDasharray: '3 3' } as const;
const TT_STYLE = {
  background: 'var(--mantine-color-body)',
  border: '1px solid var(--mantine-color-default-border)',
  borderRadius: 8,
  color: 'var(--mantine-color-text)',
  fontSize: 12,
} as const;

interface AdminStats {
  total_users: number;
  free_users: number;
  pro_users: number;
  ultimate_users: number;
  mrr: number;
  arr: number;
  new_users_7d: number;
  new_users_30d: number;
  conversion_rate: number;
  total_candidatures: number;
  total_relances: number;
  total_etablissements: number;
  avg_cands_per_user: number;
}

interface AdminUserRow {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  plan: 'free' | 'pro' | 'ultimate' | string;
  billing_period: 'monthly' | 'yearly' | null;
  role: string;
  is_active: boolean;
  nb_candidatures: number;
  created_at: string | null;
}

interface MrrPoint { month: string; mrr: number; active_users: number }
interface SignupPoint { date: string; signups: number; upgrades: number }
interface PlanPoint { name: string; plan: 'free' | 'pro' | 'ultimate'; value: number }
interface CandPoint { date: string; count: number }
interface PromoRow {
  id: string;
  name: string | null;
  percent_off: number | null;
  amount_off: number | null;
  duration: string;
  times_redeemed: number;
  valid: boolean;
}

const defaultStats: AdminStats = {
  total_users: 0,
  free_users: 0,
  pro_users: 0,
  ultimate_users: 0,
  mrr: 0,
  arr: 0,
  new_users_7d: 0,
  new_users_30d: 0,
  conversion_rate: 0,
  total_candidatures: 0,
  total_relances: 0,
  total_etablissements: 0,
  avg_cands_per_user: 0,
};

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '-';
}

function planBadge(plan: string) {
  const map: Record<string, { color: string; label: string }> = {
    free: { color: 'gray', label: 'Free' },
    pro: { color: 'blue', label: 'Pro' },
    ultimate: { color: 'violet', label: 'Ultimate' },
  };
  const entry = map[plan] ?? map.free;
  return <Badge variant="light" color={entry.color}>{entry.label}</Badge>;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">{label}</Text>
      <Text size="xl" fw={900} mt={4} className={classes.statsValue}>{value}</Text>
      {sub ? <Text size="xs" c="dimmed" mt={2}>{sub}</Text> : null}
    </Paper>
  );
}

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [mrrData, setMrrData] = useState<MrrPoint[]>([]);
  const [signups, setSignups] = useState<SignupPoint[]>([]);
  const [plans, setPlans] = useState<PlanPoint[]>([]);
  const [cands, setCands] = useState<CandPoint[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
    const [statsRes, usersRes, mrrRes, signupsRes, plansRes, candsRes, promosRes] = await Promise.all([
      axiosInstance.get<AdminStats>('/admin/stats'),
      axiosInstance.get<AdminUserRow[]>('/admin/users'),
      axiosInstance.get<MrrPoint[]>('/admin/analytics/mrr-history'),
      axiosInstance.get<SignupPoint[]>('/admin/analytics/signups'),
      axiosInstance.get<PlanPoint[]>('/admin/analytics/plan-distribution'),
      axiosInstance.get<CandPoint[]>('/admin/analytics/candidatures-daily'),
      axiosInstance.get<{ promos: PromoRow[] }>('/admin/promos'),
    ]);
    setStats(statsRes.data);
    setUsers(usersRes.data);
    setMrrData(mrrRes.data);
    setSignups(signupsRes.data);
    setPlans(plansRes.data);
    setCands(candsRes.data);
    setPromos(promosRes.data.promos);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (err) {
        if (handle403(err)) return;
        notifications.show({ title: 'Erreur', message: 'Impossible de charger le backoffice.', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [navigate]);

  const updateUserPlan = async (userId: string, plan: 'free' | 'pro' | 'ultimate') => {
    try {
      setPendingAction(`${userId}:${plan}`);
      await axiosInstance.patch(`/admin/users/${userId}/status`, {
        plan,
        billing_period: plan === 'free' ? null : 'monthly',
      });
      await refresh();
      notifications.show({ message: 'Plan mis à jour.', color: 'green' });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: 'Impossible de mettre à jour le plan.', color: 'red' });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      setPendingAction(`${userId}:toggle`);
      await axiosInstance.patch(`/admin/users/${userId}/toggle-active`);
      await refresh();
      notifications.show({ message: 'Compte mis à jour.', color: 'blue' });
    } catch (err) {
      if (handle403(err)) return;
      notifications.show({ message: 'Impossible de modifier le compte.', color: 'red' });
    } finally {
      setPendingAction(null);
    }
  };

  const exportCsv = async () => {
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
    return users.filter((user) =>
      (user.email ?? '').toLowerCase().includes(q) ||
      [user.prenom, user.nom].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [users, search]);

  if (accessDenied) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Alert color="red">Accès refusé. Redirection en cours.</Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" p="lg" className={classes.shell}>
      <Paper className={classes.hero} p="xl" radius="md" withBorder>
        <span className={classes.kicker}>Admin</span>
        <h1 className={classes.heroTitle}>Dashboard SaaS OfferTrail</h1>
        <Text c="dimmed">Suivi revenus, plans, promotions Stripe et activité produit.</Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {loading ? [...Array(4)].map((_, index) => <Skeleton key={index} height={104} radius="md" />) : (
          <>
            <KpiCard label="MRR" value={`${stats.mrr.toFixed(2)} €`} sub={`${stats.new_users_30d} inscrits 30j`} />
            <KpiCard label="ARR" value={`${stats.arr.toFixed(2)} €`} sub={`${stats.new_users_7d} inscrits 7j`} />
            <KpiCard label="Users actifs" value={String(stats.pro_users + stats.ultimate_users)} sub={`${stats.pro_users} Pro · ${stats.ultimate_users} Ultimate`} />
            <KpiCard label="Conversion" value={`${stats.conversion_rate} %`} sub={`${stats.total_users} utilisateurs`} />
          </>
        )}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">MRR 12 mois</Text>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mrrData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={TT_STYLE} />
              <Line type="monotone" dataKey="mrr" stroke={COLORS.pro} strokeWidth={2} dot={false} name="MRR" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">Inscriptions vs upgrades 30j</Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={signups}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={TICK} interval={4} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Legend />
              <Bar dataKey="signups" fill={COLORS.free} name="Inscriptions" radius={[3, 3, 0, 0]} />
              <Bar dataKey="upgrades" fill={COLORS.green} name="Upgrades" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">Répartition plans</Text>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={plans} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label>
                {plans.map((entry) => (
                  <Cell key={entry.plan} fill={COLORS[entry.plan]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TT_STYLE} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">Candidatures par jour 30j</Text>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cands}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={TICK} interval={4} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Area type="monotone" dataKey="count" stroke={COLORS.ultimate} fill={COLORS.ultimate} fillOpacity={0.18} name="Candidatures" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </SimpleGrid>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Promos actives</Title>
          <Badge variant="light">{promos.length} coupons Stripe</Badge>
        </Group>
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Réduction</Table.Th>
                <Table.Th>Durée</Table.Th>
                <Table.Th>Utilisations</Table.Th>
                <Table.Th>Statut</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {promos.length === 0 ? (
                <Table.Tr><Table.Td colSpan={6}><Text c="dimmed">Aucune promo Stripe configurée.</Text></Table.Td></Table.Tr>
              ) : promos.map((promo) => (
                <Table.Tr key={promo.id}>
                  <Table.Td>{promo.name || '-'}</Table.Td>
                  <Table.Td><Text ff="monospace">{promo.id}</Text></Table.Td>
                  <Table.Td>{promo.percent_off ? `${promo.percent_off}%` : `${(promo.amount_off ?? 0) / 100}€`}</Table.Td>
                  <Table.Td>{promo.duration}</Table.Td>
                  <Table.Td>{promo.times_redeemed}</Table.Td>
                  <Table.Td><Badge color={promo.valid ? 'green' : 'red'}>{promo.valid ? 'Actif' : 'Expiré'}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Stack gap={2}>
            <Title order={3}>Gestion users</Title>
            <Text size="sm" c="dimmed">{stats.total_candidatures} candidatures · {stats.total_relances} relances · moyenne {stats.avg_cands_per_user}</Text>
          </Stack>
          <Group>
            <TextInput
              placeholder="Rechercher email"
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Button leftSection={<IconDownload size={14} />} variant="light" onClick={() => void exportCsv()}>
              Export CSV
            </Button>
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={980}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Période</Table.Th>
                <Table.Th>Rôle</Table.Th>
                <Table.Th>Candidatures</Table.Th>
                <Table.Th>Inscription</Table.Th>
                <Table.Th>Compte</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? [...Array(4)].map((_, index) => (
                <Table.Tr key={index}>{[...Array(8)].map((__, cell) => <Table.Td key={cell}><Skeleton height={14} /></Table.Td>)}</Table.Tr>
              )) : filteredUsers.map((user) => (
                <Table.Tr key={user.id} opacity={user.is_active ? 1 : 0.55}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text fw={700} size="sm">{user.email || '—'}</Text>
                      <Text c="dimmed" size="xs">{[user.prenom, user.nom].filter(Boolean).join(' ') || user.id}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>{planBadge(user.plan)}</Table.Td>
                  <Table.Td>{user.billing_period === 'yearly' ? 'Annuel' : user.billing_period === 'monthly' ? 'Mensuel' : '-'}</Table.Td>
                  <Table.Td><Badge variant="light" color={user.role === 'admin' ? 'yellow' : 'gray'}>{user.role}</Badge></Table.Td>
                  <Table.Td>{user.nb_candidatures}</Table.Td>
                  <Table.Td>{formatDate(user.created_at)}</Table.Td>
                  <Table.Td><Badge color={user.is_active ? 'green' : 'red'}>{user.is_active ? 'Actif' : 'Désactivé'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Button size="xs" variant="light" disabled={!!pendingAction || user.plan === 'pro'} loading={pendingAction === `${user.id}:pro`} onClick={() => void updateUserPlan(user.id, 'pro')}>Upgrade</Button>
                      <Button size="xs" variant="light" color="violet" disabled={!!pendingAction || user.plan === 'ultimate'} loading={pendingAction === `${user.id}:ultimate`} onClick={() => void updateUserPlan(user.id, 'ultimate')}>Ultimate</Button>
                      <Button size="xs" variant="light" color="orange" disabled={!!pendingAction || user.plan === 'free'} loading={pendingAction === `${user.id}:free`} onClick={() => void updateUserPlan(user.id, 'free')}>Downgrade</Button>
                      <Button size="xs" variant="light" color={user.is_active ? 'red' : 'teal'} disabled={!!pendingAction} loading={pendingAction === `${user.id}:toggle`} onClick={() => void toggleActive(user.id)}>
                        {user.is_active ? 'Désactiver' : 'Réactiver'}
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
