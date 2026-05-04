import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stack, Paper, Group, Table, TextInput, Select,
  Checkbox, Center, Loader, Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useApplications } from '../hooks/useApplications';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import { ProbityBadge } from '../components/atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../components/atoms/OrganizationTypeBadge';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Button } from '../components/atoms/Button';
import { PageHeader } from '../components/molecules/PageHeader';
import { STATUTS } from '../constants/statuts';
import { useI18n } from '../i18n';
import classes from './ApplicationsPage.module.css';

export function ApplicationsPage() {
  const { t } = useI18n();

  const STATUS_OPTIONS = useMemo(() => [
    { value: '', label: t('status.all') },
    ...STATUTS.map((s) => ({ value: s, label: t(`status.${s}`) })),
  ], [t]);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { apps, total, orgMap, loading, error, refetch } = useApplications({
    search: searchTerm,
    status: statusFilter,
    page,
    limit,
    showHidden,
  });

  useEffect(() => { document.title = t('nav.applications') + ' — OfferTrail'; }, [t]);
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, showHidden]);

  if (error && (error as { response?: { status?: number } }).response?.status === 401) {
    navigate('/login');
    return null;
  }

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      {showModal && (
        <NewApplicationModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            notifications.show({ message: t('application.notifAdded'), color: 'green' });
            refetch();
          }}
        />
      )}

      <PageHeader
        title={t('nav.applications')}
        count={loading ? null : total}
        actions={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            {t('dashboard.newApplication')}
          </Button>
        }
      />

      <Paper p="lg" radius="lg" withBorder>
        <Group gap="sm" mb="md" wrap="wrap">
          <TextInput
            label={t('dashboard.search')}
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <Select
            label={t('dashboard.status')}
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v ?? '')}
            style={{ minWidth: 160 }}
          />
          <Checkbox
            mt="xl"
            label={t('dashboard.showHidden')}
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
        </Group>

        {loading ? (
          <Center h={120}><Loader /></Center>
        ) : apps.length === 0 ? (
          <EmptyState
            title={t('dashboard.noApplicationsTitle')}
            description={t('dashboard.noApplicationsDesc')}
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
                              {t('newApplication.finalCustomer')}: {orgMap.get(app.final_customer_organization_id)?.name || app.final_customer_name || '-'}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>{app.title}</Table.Td>
                      <Table.Td><StatusBadge status={app.status} size="md" /></Table.Td>
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
      </Paper>
    </Stack>
  );
}

export default ApplicationsPage;
