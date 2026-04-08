import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stack, Paper, SimpleGrid, Group, Text, Title, Table, TextInput, Select,
  Checkbox, Center, Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useApplications } from '../hooks/useApplications';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import { ProbityBadge } from '../components/atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../components/atoms/OrganizationTypeBadge';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Button } from '../components/atoms/Button';
import { statusLabelMap } from '../utils/statut';
import { useI18n } from '../i18n';
import classes from './ApplicationsPage.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'INTERESTED', label: statusLabelMap.INTERESTED },
  { value: 'APPLIED', label: statusLabelMap.APPLIED },
  { value: 'INTERVIEW', label: statusLabelMap.INTERVIEW },
  { value: 'OFFER', label: statusLabelMap.OFFER },
  { value: 'REJECTED', label: statusLabelMap.REJECTED },
];

export function ApplicationsPage() {
  const { t } = useI18n();
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

  useEffect(() => { document.title = 'Candidatures — OfferTrail'; }, []);
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
            notifications.show({ message: 'Candidature ajoutée', color: 'green' });
            refetch();
          }}
        />
      )}

      {/* Hero */}
      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">◎ {t('nav.applications')}</Text>
            <Title order={1}>Candidatures</Title>
            <Text c="dimmed">
              Liste dédiée aux candidatures avec badges de statut, filtres simples, et accès direct aux fiches détail.
            </Text>
            <Group mt="sm">
              <Button variant="primary" onClick={() => setShowModal(true)}>{t('dashboard.newApplication')}</Button>
            </Group>
          </Stack>
          <Paper p="lg" radius="md" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Volume</Text>
            <Text size={28} fw={700} mt={4}>{total}</Text>
            <Text size="sm" c="dimmed">candidatures dans la liste courante</Text>
          </Paper>
        </SimpleGrid>
      </Paper>

      {/* Table */}
      <Paper p="lg" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
          <TextInput
            label={t('dashboard.search')}
            placeholder="Entreprise, poste, contact..."
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
                          <Text size="xs" c="dimmed">{app.source || 'Direct'} • {app.type}</Text>
                          {app.final_customer_organization_id && (
                            <Text size="xs" c="dimmed">
                              Client final: {orgMap.get(app.final_customer_organization_id)?.name || app.final_customer_name || '-'}
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
