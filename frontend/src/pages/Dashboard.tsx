import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stack, SimpleGrid, Group, Text, Title, Paper, Table, TextInput, Select,
  Checkbox, Tabs, Notification, Center, Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDashboard } from '../hooks/useDashboard';
import { KPICard } from '../components/molecules/KPICard';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import { MonthlyApplicationsChart } from '../components/organisms/MonthlyApplicationsChart';
import { ProbityBadge } from '../components/atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../components/atoms/OrganizationTypeBadge';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import { EmptyState } from '../components/atoms/EmptyState';
import { statusLabelMap } from '../utils/statut';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { PlanLimitBanner } from '../components/PlanLimitBanner';
import classes from './Dashboard.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'INTERESTED', label: statusLabelMap.INTERESTED },
  { value: 'APPLIED', label: statusLabelMap.APPLIED },
  { value: 'INTERVIEW', label: statusLabelMap.INTERVIEW },
  { value: 'OFFER', label: statusLabelMap.OFFER },
  { value: 'REJECTED', label: statusLabelMap.REJECTED },
];

export function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('apps');

  const {
    kpis, followups, apps, total, orgMap, sub, insights,
    loading, loadingInsights, error, refetch, markFollowup, loadInsights,
  } = useDashboard({ search: searchTerm, status: statusFilter, page, limit, showHidden });

  useEffect(() => { document.title = 'Tableau de bord — OfferTrail'; }, []);
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, showHidden]);
  useEffect(() => {
    if (activeTab === 'insights' && !insights) loadInsights();
  }, [activeTab]);

  if (error && (error as { response?: { status?: number } }).response?.status === 401) {
    void signOut().finally(() => navigate('/login', { replace: true }));
    return null;
  }

  const handleMarkFollowup = async (id: number) => {
    try {
      await markFollowup(id);
      notifications.show({ message: 'Relance mise à jour', color: 'green' });
    } catch {
      notifications.show({ message: 'Impossible de mettre à jour la relance.', color: 'red' });
    }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {showModal && (
        <NewApplicationModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            notifications.show({ message: 'Candidature ajoutée', color: 'green' });
            refetch();
          }}
        />
      )}

      <PlanLimitBanner sub={sub} />

      {/* Hero */}
      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('dashboard.kicker')}</Text>
            <Title order={1} className={classes.heroTitle}>{t('dashboard.title')}</Title>
            <Text c="dimmed" maw={640}>{t('dashboard.copy')}</Text>
            <Group mt="sm">
              <Button variant="primary" onClick={() => setShowModal(true)}>{t('dashboard.newApplication')}</Button>
              <Link to="/app/import"><Button variant="ghost">{t('dashboard.import')}</Button></Link>
            </Group>
          </Stack>
          <Stack gap="md">
            <div className={classes.sideStat}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('dashboard.active')}</Text>
              <Text size={28} fw={700} lh={1} mt={4}>{kpis.active_count}</Text>
              <Text size="sm" c="dimmed">{t('dashboard.activeHint')}</Text>
            </div>
            <div className={classes.sideStat}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('dashboard.responses')}</Text>
              <Text size={28} fw={700} lh={1} mt={4}>{kpis.response_rate}%</Text>
              <Text size="sm" c="dimmed">{kpis.responded_count} {t('dashboard.responsesHint')}</Text>
            </div>
            <div className={classes.sideStat}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('dashboard.followups')}</Text>
              <Text size={28} fw={700} lh={1} mt={4}>{kpis.due_followups}</Text>
              <Text size="sm" c="dimmed">{t('dashboard.followupsHint')}</Text>
            </div>
          </Stack>
        </SimpleGrid>
      </Paper>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        <KPICard label={t('dashboard.totalApplications')} value={kpis.total_count} />
        <KPICard label={t('dashboard.activePipeline')} value={kpis.active_count} subValue={t('dashboard.ongoingProcesses')} />
        <KPICard label={t('dashboard.dueFollowups')} value={kpis.due_followups} subValue={t('dashboard.attentionRequired')} />
        <KPICard label={t('dashboard.rejectedRate')} value={`${kpis.rejected_rate}%`} subValue={`${kpis.rejected_count} ${t('dashboard.refusals')}`} />
        <KPICard label={t('dashboard.responseRate')} value={`${kpis.response_rate}%`} subValue={`${kpis.responded_count} ${t('dashboard.responsesCount')}`} />
        <KPICard label={t('dashboard.avgResponseTime')} value={kpis.avg_response_time ?? '-'} subValue={t('dashboard.days')} />
      </SimpleGrid>

      {/* Main panel */}
      <Paper p="lg" radius="lg" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="apps">{t('dashboard.tabApplications')}</Tabs.Tab>
            <Tabs.Tab value="queue">{t('dashboard.tabFollowups')}</Tabs.Tab>
            <Tabs.Tab value="insights">{t('dashboard.tabInsights')}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="apps">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
              <TextInput
                placeholder="Entreprise, poste, contact..."
                label={t('dashboard.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                label={t('dashboard.status')}
                data={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v ?? '')}
              />
              <Checkbox
                mt="xl"
                label={t('dashboard.showHidden')}
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
            </SimpleGrid>

            {loading ? (
              <Center h={120}><Loader /></Center>
            ) : apps.length === 0 ? (
              <EmptyState
                title="Aucune candidature pour l'instant."
                description="Commence par en ajouter une."
                action={{ label: t('dashboard.newApplication'), onClick: () => setShowModal(true) }}
              />
            ) : (
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('dashboard.company')}</Table.Th>
                      <Table.Th>{t('dashboard.position')}</Table.Th>
                      <Table.Th>{t('dashboard.status')}</Table.Th>
                      <Table.Th>{t('dashboard.applied')}</Table.Th>
                      <Table.Th>{t('dashboard.action')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {apps.map((app) => {
                      const org = orgMap.get(app.organization_id || -1);
                      return (
                        <Table.Tr key={app.id}>
                          <Table.Td>
                            <Stack gap={4}>
                              <Group gap="xs">
                                <Text fw={700}>{app.company}</Text>
                                {org && <OrganizationTypeBadge type={org.type} size="xs" />}
                                {org && <ProbityBadge score={org.probity_score} level={org.probity_level} showScore={false} />}
                              </Group>
                              <Text size="xs" c="dimmed">{app.source || t('dashboard.sourceDirect')} • {app.type}</Text>
                              {app.final_customer_organization_id && (
                                <Text size="xs" c="dimmed">
                                  Client final: {orgMap.get(app.final_customer_organization_id)?.name || app.final_customer_name || '-'}
                                </Text>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>{app.title}</Table.Td>
                          <Table.Td><StatusBadge status={app.status} /></Table.Td>
                          <Table.Td>{app.applied_at || '-'}</Table.Td>
                          <Table.Td>
                            <Link to={`/app/candidatures/${app.id}`}>
                              <Button variant="ghost" size="small">{t('common.details')}</Button>
                            </Link>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}

            {total > limit && (
              <Group justify="center" mt="md">
                <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  {t('dashboard.previous')}
                </Button>
                <Text size="sm" c="dimmed">
                  {t('dashboard.page')} {page} / {Math.ceil(total / limit)}
                </Text>
                <Button variant="ghost" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>
                  {t('dashboard.next')}
                </Button>
              </Group>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="queue">
            {followups.length > 0 ? (
              <Stack gap="sm">
                {followups.map((app) => (
                  <Paper
                    key={app.id}
                    p="md"
                    radius="md"
                    withBorder
                    className={classes.followupCard}
                    onClick={() => navigate(`/app/candidatures/${app.id}`)}
                  >
                    <Group justify="space-between">
                      <div>
                        <Group gap="xs">
                          <Text fw={700}>{app.company}</Text>
                          <StatusBadge status={app.status} />
                        </Group>
                        <Text size="sm" c="dimmed">{app.title}</Text>
                        <Text size="xs" c="dimmed">{t('dashboard.nextFollowup')}: {app.next_followup_at || '-'}</Text>
                      </div>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleMarkFollowup(app.id); }}
                      >
                        {t('dashboard.markDone')}
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <EmptyState title={t('dashboard.noFollowups')} />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="insights">
            {loadingInsights ? (
              <Center h={200}><Loader /></Center>
            ) : insights ? (
              <MonthlyApplicationsChart data={insights.months} year={insights.year} />
            ) : (
              <EmptyState
                title={t('dashboard.failedInsights')}
                action={{ label: t('common.retry'), onClick: loadInsights }}
              />
            )}
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
}
