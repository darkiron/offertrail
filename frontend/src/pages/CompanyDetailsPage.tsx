import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Anchor, Badge, Chip, Group, Paper, SimpleGrid, Stack, Text, Title,
} from '@mantine/core';
import { api } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import StatusBadge from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import OrganizationEditModal from '../components/organisms/OrganizationEditModal';
import ContactEditModal from '../components/organisms/ContactEditModal';
import type { Application, Contact, Organization } from '../types';
import { useI18n } from '../i18n';
import classes from './CompanyDetailsPage.module.css';

type CompanyDetails = Organization & {
  applications: Application[];
  contacts: Contact[];
  events: Array<{
    id: number;
    ts: string;
    type: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    application?: { id: number; title: string; status: string };
    contact?: { id: number; name: string };
  }>;
};

type DetailTab = 'overview' | 'applications' | 'contacts' | 'activity';

const tabDefinitions = (t: (k: string) => string): Array<{ id: DetailTab; label: string }> => [
  { id: 'overview', label: t('organization.overview') },
  { id: 'applications', label: t('organization.applications') },
  { id: 'contacts', label: t('organization.contacts') },
  { id: 'activity', label: t('organization.activity') },
];

const formatDate = (value: string | null | undefined, withTime: boolean, locale: string) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString(locale.startsWith('fr') ? 'fr-FR' : 'en-US', withTime ? {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  } : {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatEventLabel = (rawType: string | undefined, t: (k: string) => string) => {
  const type = String(rawType || '').toLowerCase();
  const key = `organization.events.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type.replace(/_/g, ' ') || t('organization.events.event');
};

const getProbityHint = (level: Organization['probity_level'], score: number | null, t: (k: string, p?: object) => string) => {
  switch (level) {
    case 'fiable': return score !== null ? t('organization.probityHintFiable') : t('organization.probityHintFiableSimple');
    case 'moyen': return t('organization.probityHintMoyen');
    case 'méfiance': return t('organization.probityHintRisque');
    case 'insuffisant': return t('organization.probityHintInsuffisant');
    default: return t('organization.probityHintDefault');
  }
};

export const CompanyDetailsPage: React.FC = () => {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchCompany = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCompany(Number(id));
      setData(response);
    } catch {
      setError(t('organization.detailError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = t('nav.organizations') + ' — OfferTrail'; }, [t]);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  if (loading && !data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder><Spinner /></Paper>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder>
          <Text c="dimmed" ta="center">{error || t('organization.detailError')}</Text>
          <Group justify="center" mt="md">
            <Anchor component={Link} to="/app/etablissements">{t('common.backToOrganizations')}</Anchor>
          </Group>
        </Paper>
      </Stack>
    );
  }

  const responseRate = data.response_rate ?? 0;
  const positiveRate = data.positive_rate ?? 0;
  const rejectionRate = Math.max(0, Math.min(100, Math.round(responseRate - positiveRate)));
  const dueFollowups = data.applications.filter(
    (app) => Boolean(app.next_followup_at) && app.status !== 'refusee' && app.status !== 'offre_recue',
  ).length;

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Anchor component={Link} to="/app/etablissements" c="dimmed" size="sm">← {t('common.backToOrganizations')}</Anchor>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.detailKicker')}</Text>
          <Title order={1} mt="xs">{data.name}</Title>
          <Group mt="md" gap="xs" wrap="wrap">
            <OrganizationTypeBadge type={data.type} />
            <ProbityBadge score={data.probity_score} level={data.probity_level} />
            {data.city ? <Badge variant="outline" size="sm">{data.city}</Badge> : null}
          </Group>
          <Text c="dimmed" mt="md" size="sm">
            {t('organization.detailCopy')}
          </Text>
          <Group mt="lg" gap="xs" wrap="wrap">
            <Button variant="primary" onClick={() => setEditingOrganization(true)}>{t('organization.editAction')}</Button>
            <Button component={Link} to={`/app/etablissements/maintenance?source=${data.id}`} variant="ghost">{t('organization.maintenanceAction')}</Button>
            {data.website ? (
              <a href={data.website} target="_blank" rel="noreferrer">
                <Button variant="ghost">{t('newApplication.orgLabels.website')}</Button>
              </a>
            ) : null}
            {data.linkedin_url ? (
              <a href={data.linkedin_url} target="_blank" rel="noreferrer">
                <Button variant="ghost">{t('newApplication.orgLabels.linkedin')}</Button>
              </a>
            ) : null}
          </Group>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.summaryTitle')}</Text>
              <Stack gap="xs">
                {[
                  { label: t('organization.lastUpdate'), value: formatDate(data.updated_at, true, locale) },
                  { label: t('organization.createdAt'), value: formatDate(data.created_at, false, locale) },
                  { label: t('organization.linkedContacts'), value: String(data.contacts.length) },
                ].map((item) => (
                  <Group key={item.label} justify="space-between">
                    <Text size="xs" c="dimmed">{item.label}</Text>
                    <Text size="xs" fw={600}>{item.value}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.cadenceTitle')}</Text>
              <Text size="sm" c="dimmed">
                {dueFollowups > 0 ? t('organization.dueFollowupsCount', { count: dueFollowups }) : t('organization.noDueFollowups')}
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {[
          { label: t('nav.applications'), value: data.total_applications, hint: t('organization.stats.totalApplicationsHint') },
          { label: t('dashboard.responseRate'), value: `${responseRate}%`, hint: t('organization.stats.responseRateHint') },
          { label: t('organization.stats.positiveRate'), value: `${positiveRate}%`, hint: t('organization.stats.positiveRateHint') },
          { label: t('organization.stats.ghosting'), value: data.ghosting_count, hint: t('organization.stats.ghostingHint') },
        ].map((stat) => (
          <Paper key={stat.label} p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{stat.label}</Text>
            <Text size="xl" fw={700} mt="xs" className={classes.statsValue}>{stat.value}</Text>
            <Text size="xs" c="dimmed" mt={4}>{stat.hint}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Group gap="xs" mb="lg" wrap="wrap">
            {tabDefinitions(t).map((tab) => (
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
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                {[
                  { label: t('dashboard.avgResponseTime'), value: data.avg_response_days ?? '-', hint: t('organization.stats.avgResponseHint') },
                  { label: t('organization.stats.rejectionRate'), value: `${rejectionRate}%`, hint: t('organization.stats.rejectionRateHint') },
                  { label: t('organization.stats.totalResponses'), value: data.total_responses, hint: t('organization.stats.totalResponsesHint') },
                  { label: t('probity.signalTitle'), value: null, hint: getProbityHint(data.probity_level, data.probity_score, t), probity: true },
                ].map((metric) => (
                  <Paper key={metric.label} p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{metric.label}</Text>
                    {metric.probity ? (
                      <div className={classes.probitySlot}>
                        <ProbityBadge score={data.probity_score} level={data.probity_level} size="md" />
                      </div>
                    ) : (
                      <Text size="xl" fw={700} mt={6}>{metric.value}</Text>
                    )}
                    <Text size="xs" c="dimmed" mt={4}>{metric.hint}</Text>
                  </Paper>
                ))}
              </SimpleGrid>

              <Paper p="md" radius="lg" className={classes.noteCard}>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('contacts.notes')}</Text>
                <Text size="sm" c="dimmed">
                  {data.notes?.trim() || t('organization.noNotes')}
                </Text>
              </Paper>
            </Stack>
          ) : null}

          {activeTab === 'applications' ? (
            data.applications.length > 0 ? (
              <Stack gap="sm">
                {data.applications.map((application) => (
                  <Paper key={application.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{application.title}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="outline" size="xs">{t(`newApplication.jobTypes.${application.type}`) || application.type}</Badge>
                          <Badge variant="outline" size="xs">{application.source || t('dashboard.sourceDirect')}</Badge>
                          <Text size="xs" c="dimmed">{t('application.appliedOn')} {formatDate(application.applied_at, false, locale)}</Text>
                        </Group>
                      </Stack>
                      <StatusBadge status={application.status} />
                    </Group>
                    <Group mt="sm" gap="xs">
                      {application.next_followup_at ? (
                        <Badge variant="outline" size="xs">{t('application.followup')}: {formatDate(application.next_followup_at, false, locale)}</Badge>
                      ) : null}
                      <Link to={`/app/candidatures/${application.id}`}>
                        <Text size="xs" c="blue">{t('contacts.openApplication')}</Text>
                      </Link>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">{t('organization.noLinkedApplications')}</Text>
            )
          ) : null}

          {activeTab === 'contacts' ? (
            data.contacts.length > 0 ? (
              <Stack gap="sm">
                {data.contacts.map((contact) => (
                  <Paper key={contact.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{contact.first_name} {contact.last_name}</Text>
                        <Group gap="xs" wrap="wrap">
                          {contact.role ? <Badge variant="outline" size="xs">{contact.role}</Badge> : null}
                          {contact.is_recruiter ? <Badge variant="light" color="pink" size="xs">{t('contacts.recruiter')}</Badge> : null}
                        </Group>
                      </Stack>
                      <Button variant="ghost" size="small" onClick={() => setEditingContact(contact)}>{t('common.edit')}</Button>
                    </Group>
                    <Group mt="sm" gap="xs" wrap="wrap">
                      {contact.email ? <Badge variant="outline" size="xs">{contact.email}</Badge> : null}
                      {contact.phone ? <Badge variant="outline" size="xs">{contact.phone}</Badge> : null}
                      {contact.linkedin_url ? (
                        <a href={contact.linkedin_url} target="_blank" rel="noreferrer">
                          <Text size="xs" c="blue">{t('contacts.linkedin')}</Text>
                        </a>
                      ) : null}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">{t('organization.noLinkedContacts')}</Text>
            )
          ) : null}

          {activeTab === 'activity' ? (
            data.events.length > 0 ? (
              <Stack gap="sm">
                {data.events.map((event) => (
                  <Paper key={`${event.id}-${event.ts}`} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{formatEventLabel(event.type || event.event_type, t)}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="outline" size="xs">{formatDate(event.ts, true, locale)}</Badge>
                          {event.application ? <Badge variant="outline" size="xs">{event.application.title}</Badge> : null}
                          {event.contact ? <Badge variant="outline" size="xs">{event.contact.name}</Badge> : null}
                        </Group>
                      </Stack>
                    </Group>
                    {event.payload && Object.keys(event.payload).length > 0 ? (
                      <Text size="xs" c="dimmed" mt={6}>{JSON.stringify(event.payload)}</Text>
                    ) : null}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">{t('organization.noRecentActivity')}</Text>
            )
          ) : null}
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap="xs" pb="md" className={classes.sectionDivider}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.infoTitle')}</Text>
              {[
                { label: t('newApplication.orgLabels.name'), value: data.name },
                { label: t('newApplication.orgLabels.type'), value: t(`organization.types.${data.type}`) || data.type },
                { label: t('newApplication.orgLabels.city'), value: data.city || t('contacts.notDefined') },
                { label: t('newApplication.orgLabels.website'), value: data.website || t('contacts.notDefined') },
                { label: t('newApplication.orgLabels.linkedin'), value: data.linkedin_url || t('contacts.notDefined') },
              ].map((item) => (
                <Group key={item.label} justify="space-between">
                  <Text size="xs" c="dimmed">{item.label}</Text>
                  <Text size="xs" fw={600}>{item.value}</Text>
                </Group>
              ))}
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.linkedViewTitle')}</Text>
              {[
                { label: t('nav.applications'), value: data.applications.length },
                { label: t('nav.contacts'), value: data.contacts.length },
                { label: t('organization.eventsTitle'), value: data.events.length },
              ].map((item) => (
                <Group key={item.label} justify="space-between">
                  <Text size="xs" c="dimmed">{item.label}</Text>
                  <Text size="xs" fw={600}>{item.value}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      {editingOrganization ? (
        <OrganizationEditModal
          organization={data}
          onClose={() => setEditingOrganization(false)}
          onSaved={() => {
            setEditingOrganization(false);
            fetchCompany();
          }}
        />
      ) : null}

      {editingContact ? (
        <ContactEditModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() => {
            setEditingContact(null);
            fetchCompany();
          }}
        />
      ) : null}
    </Stack>
  );
};

export default CompanyDetailsPage;
