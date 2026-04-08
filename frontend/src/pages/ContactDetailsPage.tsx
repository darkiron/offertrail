import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Anchor, Badge, Chip, Group, Paper, SimpleGrid, Stack, Text, Title,
} from '@mantine/core';
import { contactService } from '../services/api';
import type { Application, Contact, Organization } from '../types';
import { Button } from '../components/atoms/Button';
import StatusBadge from '../components/atoms/StatusBadge';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import ContactEditModal from '../components/organisms/ContactEditModal';
import { useI18n } from '../i18n';
import classes from './ContactDetailsPage.module.css';

type ContactDetails = Contact & {
  organization: Organization | null;
  applications: Application[];
  events: Array<{
    id: number;
    ts: string;
    type: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    application?: { id: number; title: string; status: string };
  }>;
};

type ContactTab = 'overview' | 'applications' | 'activity';

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('fr-FR', withTime ? {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  } : {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const ContactDetailsPage: React.FC = () => {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContactTab>('overview');
  const [editing, setEditing] = useState(false);

  const fetchContact = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await contactService.getById(Number(id));
      setData(response);
    } catch {
      setError(t('contacts.detailError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = 'Contact — OfferTrail'; }, []);

  useEffect(() => {
    fetchContact();
  }, [id]);

  if (loading && !data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder>
          <Text c="dimmed" ta="center">{t('contacts.loadingDetail')}</Text>
        </Paper>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder>
          <Text c="dimmed" ta="center">{error || t('contacts.detailError')}</Text>
        </Paper>
      </Stack>
    );
  }

  const tabDefinitions: Array<{ id: ContactTab; label: string }> = [
    { id: 'overview', label: t('contacts.overview') },
    { id: 'applications', label: t('contacts.applications') },
    { id: 'activity', label: t('contacts.activity') },
  ];

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Anchor component={Link} to="/contacts" c="dimmed" size="sm">← {t('common.backToContacts')}</Anchor>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.detailKicker')}</Text>
          <Title order={1} mt="xs">{data.first_name} {data.last_name}</Title>
          <Text c="dimmed" mt={4}>{data.role || t('contacts.detailNoRole')}</Text>
          <Group mt="md" gap="xs" wrap="wrap">
            {data.is_recruiter ? <Badge variant="light" color="pink">{t('contacts.recruiter')}</Badge> : null}
            {data.organization ? <OrganizationTypeBadge type={data.organization.type} /> : null}
            {data.organization ? <ProbityBadge score={data.organization.probity_score} level={data.organization.probity_level} showScore={false} /> : null}
          </Group>
          <Group mt="lg" gap="xs" wrap="wrap">
            <Button variant="primary" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
            {data.email ? (
              <a href={`mailto:${data.email}`}>
                <Button variant="ghost">{t('contacts.sendEmail')}</Button>
              </a>
            ) : null}
            {data.linkedin_url ? (
              <a href={data.linkedin_url} target="_blank" rel="noreferrer">
                <Button variant="ghost">{t('contacts.linkedin')}</Button>
              </a>
            ) : null}
          </Group>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.linkedOrg')}</Text>
              <Text size="sm" c="dimmed">
                {data.organization ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/etablissements/${data.organization?.id}`)}
                    className={classes.linkedOrgButton}
                  >
                    {data.organization.name}
                  </button>
                ) : t('contacts.noLinkedOrg')}
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.applicationsLinked')}</Text>
              <Text size="xl" fw={700}>{data.applications.length}</Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.updatedAt')}</Text>
              <Text size="sm" c="dimmed">{formatDate(data.updated_at, true)}</Text>
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Group gap="xs" mb="lg">
            {tabDefinitions.map((tab) => (
              <Chip
                key={tab.id}
                checked={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
              >
                {tab.label}
              </Chip>
            ))}
          </Group>

          {activeTab === 'overview' ? (
            <Stack gap="sm">
              {[
                { label: t('contacts.email'), value: data.email || t('contacts.notDefined') },
                { label: t('contacts.phone'), value: data.phone || t('contacts.notDefined') },
                { label: t('contacts.notes'), value: data.notes || t('contacts.noNotes') },
              ].map((item) => (
                <Paper key={item.label} p="md" radius="md" withBorder>
                  <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{item.label}</Text>
                  <Text size="sm" c="dimmed" mt={6}>{item.value}</Text>
                </Paper>
              ))}
            </Stack>
          ) : null}

          {activeTab === 'applications' ? (
            data.applications.length > 0 ? (
              <Stack gap="sm">
                {data.applications.map((application) => (
                  <Paper key={application.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Text fw={700} size="sm">{application.title}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Text size="xs" c="dimmed">{application.company}</Text>
                          <Text size="xs" c="dimmed">{application.type}</Text>
                          <Text size="xs" c="dimmed">{t('dashboard.applied')} {formatDate(application.applied_at)}</Text>
                        </Group>
                      </Stack>
                      <StatusBadge status={application.status} />
                    </Group>
                    <Group mt="sm">
                      <Link to={`/app/candidatures/${application.id}`}>
                        <Text size="xs" c="blue">{t('contacts.openApplication')}</Text>
                      </Link>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">{t('contacts.noApplications')}</Text>
            )
          ) : null}

          {activeTab === 'activity' ? (
            data.events.length > 0 ? (
              <Stack gap="sm">
                {data.events.map((event) => (
                  <Paper key={`${event.id}-${event.ts}`} p="md" radius="md" withBorder>
                    <Text fw={700} size="sm">{String(event.type || event.event_type).replace(/_/g, ' ')}</Text>
                    <Text size="xs" c="dimmed" mt={4}>{formatDate(event.ts, true)}</Text>
                    {event.application ? (
                      <Group gap="xs" mt="xs">
                        <Text size="xs" c="dimmed">{event.application.title}</Text>
                        <StatusBadge status={event.application.status} size="sm" />
                      </Group>
                    ) : null}
                    {event.payload && Object.keys(event.payload).length > 0 ? (
                      <Text size="xs" c="dimmed" mt={6}>{JSON.stringify(event.payload)}</Text>
                    ) : null}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">{t('contacts.noActivity')}</Text>
            )
          ) : null}
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            {[
              {
                label: t('contacts.identity'),
                items: [`${data.first_name} ${data.last_name}`, data.role || t('contacts.noRole')],
              },
              {
                label: t('contacts.channels'),
                items: [data.email || t('contacts.noEmail'), data.phone || t('contacts.noPhone')],
              },
              {
                label: t('contacts.created'),
                items: [formatDate(data.created_at)],
              },
            ].map((section) => (
              <Stack key={section.label} gap={4} pb="md" className={classes.sectionDivider}>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{section.label}</Text>
                {section.items.map((item) => (
                  <Text key={item} size="sm" c="dimmed">{item}</Text>
                ))}
              </Stack>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>

      {editing ? (
        <ContactEditModal
          contact={data}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            fetchContact();
          }}
        />
      ) : null}
    </Stack>
  );
};

export default ContactDetailsPage;
