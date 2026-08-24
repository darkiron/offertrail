import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UiBadge as Badge,
  UiGroup as Group,
  UiPaper as Paper,
  UiGrid as SimpleGrid,
  UiStack as Stack,
  UiText as Text,
  UiTextInput as TextInput,
} from '../components/atoms/UiPrimitives';
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
import { IconDownload, IconSearch } from '@tabler/icons-react';
import { http as axiosInstance } from '@shared/api/http';
import { useI18n } from '../i18n';
import classes from './Admin.module.scss';

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'light' | 'filled';
  loading?: boolean;
  leftSection?: ReactNode;
  size?: 'xs';
  color?: string;
};
const Button = ({
  variant,
  loading,
  leftSection,
  children,
  className,
  disabled,
  size,
  color,
  ...props
}: AdminButtonProps) => (
  <button
    {...props}
    className={`${classes.button} ${className ?? ''}`}
    data-variant={variant === 'light' ? 'secondary' : 'primary'}
    data-size={size}
    data-color={color}
    disabled={disabled || loading}
  >
    {loading ? (
      '…'
    ) : (
      <>
        {leftSection}
        {children}
      </>
    )}
  </button>
);
const Alert = ({ children }: { children?: ReactNode }) => (
  <div className={classes.alert} role="alert">
    {children}
  </div>
);
const Skeleton = ({
  height = 14,
  radius,
}: {
  height?: number;
  radius?: string;
}) => (
  <span
    className={classes.skeleton}
    style={{
      height,
      borderRadius: radius === 'md' ? 'var(--ot-radius-md)' : undefined,
    }}
    aria-hidden="true"
  />
);
const Title = ({
  children,
  order = 2,
}: {
  children?: ReactNode;
  order?: 2 | 3;
}) => (order === 3 ? <h3>{children}</h3> : <h2>{children}</h2>);
type AdminTableProps = TableHTMLAttributes<HTMLTableElement> & {
  striped?: boolean;
  highlightOnHover?: boolean;
};
const Table = Object.assign(
  ({ children, striped, highlightOnHover, ...props }: AdminTableProps) => (
    <table
      {...props}
      className={classes.table}
      data-striped={striped || undefined}
      data-highlight={highlightOnHover || undefined}
    >
      {children}
    </table>
  ),
  {
    ScrollContainer: ({
      children,
      minWidth,
    }: {
      children?: ReactNode;
      minWidth?: number;
    }) => (
      <div className={classes.tableScroll} style={{ minWidth }}>
        {children}
      </div>
    ),
    Thead: ({ children }: { children?: ReactNode }) => (
      <thead>{children}</thead>
    ),
    Tbody: ({ children }: { children?: ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    Tr: ({
      children,
      opacity,
      style,
      ...props
    }: HTMLAttributes<HTMLTableRowElement> & { opacity?: number }) => (
      <tr {...props} style={{ ...style, opacity }}>
        {children}
      </tr>
    ),
    Th: ({ children }: { children?: ReactNode }) => <th>{children}</th>,
    Td: ({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
      <td {...props}>{children}</td>
    ),
  },
);

const COLORS = {
  free: 'var(--ot-muted)',
  pro: 'var(--ot-accent)',
  ultimate: 'var(--ot-ink)',
  green: 'var(--ot-success)',
};
const TICK = { fill: 'var(--ot-muted)', fontSize: 11 } as const;
const GRID = { stroke: 'var(--ot-line)', strokeDasharray: '3 3' } as const;
const TT_STYLE = {
  background: 'var(--ot-paper)',
  border: '1px solid var(--ot-line)',
  borderRadius: 8,
  color: 'var(--ot-ink)',
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

interface MrrPoint {
  month: string;
  mrr: number;
  active_users: number;
}
interface SignupPoint {
  date: string;
  signups: number;
  upgrades: number;
}
interface PlanPoint {
  name: string;
  plan: 'free' | 'pro' | 'ultimate';
  value: number;
}
interface CandPoint {
  date: string;
  count: number;
}
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

function formatDate(value: string | null | undefined, locale: string): string {
  return value ? new Intl.DateTimeFormat(locale).format(new Date(value)) : '—';
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function planBadge(
  plan: string,
  labels: Record<'free' | 'pro' | 'ultimate', string>,
) {
  const map: Record<string, { color: string; label: string }> = {
    free: { color: 'gray', label: labels.free },
    pro: { color: 'blue', label: labels.pro },
    ultimate: { color: 'violet', label: labels.ultimate },
  };
  const entry = map[plan] ?? map.free;
  return (
    <Badge variant="light" color={entry.color}>
      {entry.label}
    </Badge>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={900} mt={4} className={classes.statsValue}>
        {value}
      </Text>
      {sub ? (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      ) : null}
    </Paper>
  );
}

export function Admin() {
  const { t, locale } = useI18n();
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
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    document.title = t('admin.pageTitle');
  }, [t]);

  const handle403 = useCallback(
    (err: unknown): boolean => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAccessDenied(true);
        window.setTimeout(() => navigate('/app', { replace: true }), 1500);
        return true;
      }
      return false;
    },
    [navigate],
  );

  const refresh = useCallback(async () => {
    setLoadError(false);
    const [
      statsRes,
      usersRes,
      mrrRes,
      signupsRes,
      plansRes,
      candsRes,
      promosRes,
    ] = await Promise.all([
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
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (err) {
        if (handle403(err)) return;
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [handle403, refresh]);

  const updateUserPlan = async (
    userId: string,
    plan: 'free' | 'pro' | 'ultimate',
  ) => {
    try {
      setPendingAction(`${userId}:${plan}`);
      await axiosInstance.patch(`/admin/users/${userId}/status`, {
        plan,
        billing_period: plan === 'free' ? null : 'monthly',
      });
      await refresh();
      setNotice({ tone: 'success', message: t('admin.planUpdated') });
    } catch (err) {
      if (handle403(err)) return;
      setNotice({ tone: 'error', message: t('admin.planUpdateError') });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      setPendingAction(`${userId}:toggle`);
      await axiosInstance.patch(`/admin/users/${userId}/toggle-active`);
      await refresh();
      setNotice({ tone: 'success', message: t('admin.accountUpdated') });
    } catch (err) {
      if (handle403(err)) return;
      setNotice({ tone: 'error', message: t('admin.accountUpdateError') });
    } finally {
      setPendingAction(null);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await axiosInstance.get('/admin/export-users', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offertrail-users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (handle403(err)) return;
      setNotice({ tone: 'error', message: t('admin.exportError') });
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        (user.email ?? '').toLowerCase().includes(q) ||
        [user.prenom, user.nom]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
    );
  }, [users, search]);
  const planLabels = {
    free: t('admin.planFree'),
    pro: t('admin.planPro'),
    ultimate: t('admin.planUltimate'),
  };
  const promoDurations: Record<string, string> = {
    once: t('admin.durationOnce'),
    repeating: t('admin.durationRepeating'),
    forever: t('admin.durationForever'),
  };

  if (accessDenied) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Alert>
          <strong>{t('admin.forbiddenTitle')}</strong>
          <br />
          {t('admin.forbiddenDescription')}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" p="lg" className={classes.shell}>
      <Paper className={classes.hero} p="xl" radius="md" withBorder>
        <span className={classes.kicker}>{t('admin.kicker')}</span>
        <h1 className={classes.heroTitle}>{t('admin.title')}</h1>
        <Text c="dimmed">{t('admin.description')}</Text>
      </Paper>
      {notice ? (
        <div
          className={classes.notice}
          data-tone={notice.tone}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
        </div>
      ) : null}
      {loadError ? (
        <div className={classes.errorState} role="alert">
          <strong>{t('admin.loadError')}</strong>
          <Button variant="light" onClick={() => void refresh()}>
            {t('admin.retry')}
          </Button>
        </div>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <Skeleton key={index} height={104} radius="md" />
          ))
        ) : (
          <>
            <KpiCard
              label={t('admin.mrr')}
              value={formatMoney(stats.mrr, locale)}
              sub={t('admin.registered30').replace(
                '{{count}}',
                String(stats.new_users_30d),
              )}
            />
            <KpiCard
              label={t('admin.arr')}
              value={formatMoney(stats.arr, locale)}
              sub={t('admin.registered7').replace(
                '{{count}}',
                String(stats.new_users_7d),
              )}
            />
            <KpiCard
              label={t('admin.activeUsers')}
              value={String(stats.pro_users + stats.ultimate_users)}
              sub={t('admin.paidPlans')
                .replace('{{pro}}', String(stats.pro_users))
                .replace('{{ultimate}}', String(stats.ultimate_users))}
            />
            <KpiCard
              label={t('admin.conversion')}
              value={formatPercent(stats.conversion_rate, locale)}
              sub={t('admin.usersCount').replace(
                '{{count}}',
                String(stats.total_users),
              )}
            />
          </>
        )}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">
            {t('admin.mrrChart')}
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mrrData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip contentStyle={TT_STYLE} />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke={COLORS.pro}
                strokeWidth={2}
                dot={false}
                name={t('admin.mrr')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">
            {t('admin.signupChart')}
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={signups}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={TICK} interval={4} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Legend />
              <Bar
                dataKey="signups"
                fill={COLORS.free}
                name={t('admin.signups')}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="upgrades"
                fill={COLORS.green}
                name={t('admin.upgrades')}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="sm">
            {t('admin.plansChart')}
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={plans}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={82}
                label
              >
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
          <Text fw={700} mb="sm">
            {t('admin.applicationsChart')}
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cands}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={TICK} interval={4} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLORS.ultimate}
                fill={COLORS.ultimate}
                fillOpacity={0.18}
                name={t('admin.applications')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </SimpleGrid>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>{t('admin.promosTitle')}</Title>
          <Badge variant="light">
            {t('admin.couponsCount').replace(
              '{{count}}',
              String(promos.length),
            )}
          </Badge>
        </Group>
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('admin.promoName')}</Table.Th>
                <Table.Th>{t('admin.code')}</Table.Th>
                <Table.Th>{t('admin.reduction')}</Table.Th>
                <Table.Th>{t('admin.duration')}</Table.Th>
                <Table.Th>{t('admin.uses')}</Table.Th>
                <Table.Th>{t('admin.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {promos.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">{t('admin.noPromos')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                promos.map((promo) => (
                  <Table.Tr key={promo.id}>
                    <Table.Td>{promo.name || '—'}</Table.Td>
                    <Table.Td>
                      <Text ff="monospace">{promo.id}</Text>
                    </Table.Td>
                    <Table.Td>
                      {promo.percent_off
                        ? formatPercent(promo.percent_off, locale)
                        : formatMoney((promo.amount_off ?? 0) / 100, locale)}
                    </Table.Td>
                    <Table.Td>
                      {promoDurations[promo.duration] ?? promo.duration}
                    </Table.Td>
                    <Table.Td>{promo.times_redeemed}</Table.Td>
                    <Table.Td>
                      <Badge color={promo.valid ? 'green' : 'red'}>
                        {promo.valid ? t('admin.active') : t('admin.expired')}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Stack gap={2}>
            <Title order={3}>{t('admin.usersTitle')}</Title>
            <Text size="sm" c="dimmed">
              {t('admin.usersSummary')
                .replace('{{applications}}', String(stats.total_candidatures))
                .replace('{{followups}}', String(stats.total_relances))
                .replace('{{average}}', String(stats.avg_cands_per_user))}
            </Text>
          </Stack>
          <Group>
            <TextInput
              placeholder={t('admin.searchPlaceholder')}
              aria-label={t('admin.searchLabel')}
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Button
              leftSection={<IconDownload size={14} />}
              variant="light"
              onClick={() => void exportCsv()}
            >
              {t('admin.export')}
            </Button>
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={980}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('admin.email')}</Table.Th>
                <Table.Th>{t('admin.plan')}</Table.Th>
                <Table.Th>{t('admin.period')}</Table.Th>
                <Table.Th>{t('admin.role')}</Table.Th>
                <Table.Th>{t('admin.applications')}</Table.Th>
                <Table.Th>{t('admin.registeredAt')}</Table.Th>
                <Table.Th>{t('admin.account')}</Table.Th>
                <Table.Th>{t('admin.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                [...Array(4)].map((_, index) => (
                  <Table.Tr key={index}>
                    {[...Array(8)].map((__, cell) => (
                      <Table.Td key={cell}>
                        <Skeleton height={14} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed">{t('admin.noUsers')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id} opacity={user.is_active ? 1 : 0.55}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={700} size="sm">
                          {user.email || '—'}
                        </Text>
                        <Text c="dimmed" size="xs">
                          {[user.prenom, user.nom].filter(Boolean).join(' ') ||
                            user.id}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{planBadge(user.plan, planLabels)}</Table.Td>
                    <Table.Td>
                      {user.billing_period === 'yearly'
                        ? t('admin.yearly')
                        : user.billing_period === 'monthly'
                          ? t('admin.monthly')
                          : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={user.role === 'admin' ? 'yellow' : 'gray'}
                      >
                        {user.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{user.nb_candidatures}</Table.Td>
                    <Table.Td>{formatDate(user.created_at, locale)}</Table.Td>
                    <Table.Td>
                      <Badge color={user.is_active ? 'green' : 'red'}>
                        {user.is_active
                          ? t('admin.active')
                          : t('admin.disabled')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Button
                          size="xs"
                          variant="light"
                          disabled={!!pendingAction || user.plan === 'pro'}
                          loading={pendingAction === `${user.id}:pro`}
                          onClick={() => void updateUserPlan(user.id, 'pro')}
                        >
                          {t('admin.upgradePro')}
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="violet"
                          disabled={!!pendingAction || user.plan === 'ultimate'}
                          loading={pendingAction === `${user.id}:ultimate`}
                          onClick={() =>
                            void updateUserPlan(user.id, 'ultimate')
                          }
                        >
                          {t('admin.upgradeUltimate')}
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="orange"
                          disabled={!!pendingAction || user.plan === 'free'}
                          loading={pendingAction === `${user.id}:free`}
                          onClick={() => void updateUserPlan(user.id, 'free')}
                        >
                          {t('admin.downgrade')}
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color={user.is_active ? 'red' : 'teal'}
                          disabled={!!pendingAction}
                          loading={pendingAction === `${user.id}:toggle`}
                          onClick={() => void toggleActive(user.id)}
                        >
                          {user.is_active
                            ? t('admin.disable')
                            : t('admin.enable')}
                        </Button>
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
  );
}
