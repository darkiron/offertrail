import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  Anchor, Badge, Group, Chip, Paper, Select, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import { organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import type { Organization, OrganizationType } from '../types';
import { PageHeader } from '../components/molecules/PageHeader';
import classes from './OrganizationsPage.module.css';

type OrganizationTab = 'all' | 'engaged' | 'responsive' | 'watchlist';

const organizationTypes: OrganizationType[] = [
  'CLIENT_FINAL', 'ESN', 'CABINET_RECRUTEMENT', 'STARTUP',
  'PME', 'GRAND_COMPTE', 'PORTAGE', 'AUTRE',
];

export const OrganizationsPage: React.FC = () => {
  const { t, locale } = useI18n();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OrganizationTab>('all');
  const navigate = useNavigate();

  const organizationTypeLabels = useMemo<Record<OrganizationType, string>>(() => ({
    CLIENT_FINAL: t('organization.typeClientFinal'),
    ESN: t('organization.typeESN'),
    CABINET_RECRUTEMENT: t('organization.typeCabinet'),
    STARTUP: t('organization.typeStartup'),
    PME: t('organization.typePME'),
    GRAND_COMPTE: t('organization.typeGrandCompte'),
    PORTAGE: t('organization.typePortage'),
    AUTRE: t('organization.typeAutre'),
  }), [t]);

  const tabDefinitions = useMemo(() => [
    { id: 'all' as OrganizationTab, label: t('organization.tabAll'), hint: t('organization.tabAllHint') },
    { id: 'engaged' as OrganizationTab, label: t('organization.tabEngaged'), hint: t('organization.tabEngagedHint') },
    { id: 'responsive' as OrganizationTab, label: t('organization.tabResponsive'), hint: t('organization.tabResponsiveHint') },
    { id: 'watchlist' as OrganizationTab, label: t('organization.tabWatchlist'), hint: t('organization.tabWatchlistHint') },
  ], [t]);

  useEffect(() => {
    document.title = t('organization.pageTitle');
  }, [t]);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getAll({
        type: typeFilter || undefined,
        search: search || undefined,
      });
      setOrganizations(data);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [typeFilter, search]);

  const getPositiveRate = (organization: Organization) => {
    const rawValue = (organization as Organization & { positive_rate?: number | null }).positive_rate;
    return typeof rawValue === 'number' ? rawValue : 0;
  };

  const getRejectionRate = (organization: Organization) => {
    const rawValue = (organization as Organization & { rejection_rate?: number | null }).rejection_rate;
    if (typeof rawValue === 'number') {
      return rawValue;
    }
    return Math.max(0, Math.min(100, Math.round((organization.response_rate || 0) - getPositiveRate(organization))));
  };

  const getHealthBucket = useCallback((organization: Organization) => {
    if ((organization.response_rate || 0) >= 45) return { color: 'green', label: t('organization.healthGood') };
    if ((organization.response_rate || 0) >= 20) return { color: 'yellow', label: t('organization.healthMedium') };
    return { color: 'red', label: t('organization.healthCold') };
  }, [t]);

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [locale]);

  const typeCounts = organizationTypes.reduce<Record<string, number>>((acc, type) => {
    acc[type] = organizations.filter((org) => org.type === type).length;
    return acc;
  }, {});

  const totalApplications = organizations.reduce((sum, org) => sum + (org.total_applications ?? 0), 0);
  const engagedOrganizations = organizations.filter((org) => (org.total_applications ?? 0) > 0);
  const watchlistOrganizations = organizations.filter(
    (org) => (org.total_applications ?? 0) > 0 && (org.response_rate ?? 0) < 20,
  );
  const averageResponseRate = organizations.length
    ? Math.round(organizations.reduce((sum, org) => sum + (org.response_rate ?? 0), 0) / organizations.length)
    : 0;

  const visibleOrganizations = organizations.filter((org) => {
    switch (activeTab) {
      case 'engaged': return (org.total_applications ?? 0) > 0;
      case 'responsive': return (org.response_rate ?? 0) >= 35;
      case 'watchlist': return (org.total_applications ?? 0) > 0 && (org.response_rate ?? 0) < 20;
      default: return true;
    }
  });

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <PageHeader
        title={t('organization.pageHeader')}
        count={loading ? null : organizations.length}
        actions={
          <Anchor component={Link} to="/app/etablissements/maintenance">
            <Badge variant="filled" size="md" radius="xl">{t('organization.maintenanceBtn')}</Badge>
          </Anchor>
        }
      />

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {[
          { label: t('organization.kpiTotal'), value: organizations.length, hint: t('organization.kpiTotalHint') },
          { label: t('organization.kpiActive'), value: engagedOrganizations.length, hint: t('organization.kpiActiveHint') },
          { label: t('organization.kpiAvgRate'), value: `${averageResponseRate}%`, hint: t('organization.kpiAvgRateHint') },
          { label: t('organization.kpiVolume'), value: totalApplications, hint: t('organization.kpiVolumeHint') },
        ].map((kpi) => (
          <Paper key={kpi.label} p="md" radius="md" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{kpi.label}</Text>
            <Text size="xl" fw={700} mt={4}>{kpi.value}</Text>
            <Text size="xs" c="dimmed">{kpi.hint}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Paper p="lg" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          <TextInput
            placeholder={t('organization.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder={t('organization.allTypes')}
            value={typeFilter || null}
            onChange={(v) => setTypeFilter(v ?? '')}
            data={organizationTypes.map((t) => ({ value: t, label: organizationTypeLabels[t] }))}
            clearable
          />
        </SimpleGrid>
        <Group gap="xs" wrap="wrap">
          {organizationTypes.map((type) => (
            <Chip
              key={type}
              checked={typeFilter === type}
              onClick={() => setTypeFilter((c) => (c === type ? '' : type))}
              size="sm"
            >
              {organizationTypeLabels[type]} ({typeCounts[type] ?? 0})
            </Chip>
          ))}
        </Group>
      </Paper>

      {/* List */}
      <Paper p="lg" radius="lg" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.visualSort')}</Text>
            <Group gap="xs">
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
          </Stack>
          <Text size="sm" c="dimmed">
            {loading ? t('common.loading') : `${visibleOrganizations.length} ${t('organization.results')}`}
          </Text>
        </Group>

        {loading ? (
          <Spinner />
        ) : error ? (
          <Paper p="md" radius="md" className={classes.alertCard}>
            <Text c="red">{error}</Text>
          </Paper>
        ) : visibleOrganizations.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">{t('organization.noMatch')}</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {visibleOrganizations.map((organization) => {
              const positiveRate = getPositiveRate(organization);
              const rejectionRate = getRejectionRate(organization);
              const health = getHealthBucket(organization);
              const notePreview = organization.notes?.trim()
                ? organization.notes.trim().slice(0, 110)
                : t('organization.noNotes');

              return (
                <Paper
                  key={organization.id}
                  p="lg"
                  radius="lg"
                  withBorder
                  className={classes.card}
                  onClick={() => navigate(`/app/etablissements/${organization.id}`)}
                >
                  <Group justify="space-between" mb="xs">
                    <Badge variant="light" color="blue" size="sm">{organizationTypeLabels[organization.type]}</Badge>
                    <Badge variant="light" color={health.color} size="sm">{health.label}</Badge>
                  </Group>

                  <Text fw={700} size="lg" mt="xs">{organization.name}</Text>

                  <Group mt="xs" gap="xs" wrap="wrap">
                    <Text size="sm" c="dimmed">{organization.city || t('organization.noCity')}</Text>
                    {organization.website ? (
                      <Anchor
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('organization.viewSite')}
                      </Anchor>
                    ) : null}
                  </Group>

                  <Text size="sm" c="dimmed" mt="sm" className={classes.notePreview}>
                    {notePreview}
                    {organization.notes && organization.notes.trim().length > 110 ? '...' : ''}
                  </Text>

                  <SimpleGrid cols={2} spacing="xs" mt="md">
                    {[
                      { label: t('organization.statApplications'), value: organization.total_applications ?? 0, hint: t('organization.statApplicationsHint') },
                      { label: t('organization.statResponseRate'), value: `${organization.response_rate ?? 0}%`, progress: organization.response_rate ?? 0 },
                      { label: t('organization.statPositiveRate'), value: `${positiveRate}%`, hint: t('organization.statPositiveRateHint') },
                      { label: t('organization.statRejectionRate'), value: `${rejectionRate}%`, hint: t('organization.statRejectionRateHint') },
                    ].map((stat) => (
                      <Paper key={stat.label} p="sm" radius="md" withBorder>
                        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{stat.label}</Text>
                        <Text size="lg" fw={700} mt={4}>{stat.value}</Text>
                        {stat.hint ? <Text size="xs" c="dimmed">{stat.hint}</Text> : null}
                        {stat.progress !== undefined ? (
                          <div className={classes.progressTrack}>
                            <div className={classes.progressBar} style={{ width: `${Math.max(0, Math.min(100, stat.progress))}%` }} />
                          </div>
                        ) : null}
                      </Paper>
                    ))}
                  </SimpleGrid>

                  <Group justify="space-between" mt="md" pt="sm" className={classes.sectionFooter}>
                    <Stack gap={2}>
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.lastInteraction')}</Text>
                      <Text size="sm" c="dimmed">{formatDate(organization.updated_at)}</Text>
                    </Stack>
                    <Text size="sm" c="dimmed">{t('organization.openCard')}</Text>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}
      </Paper>
    </Stack>
  );
};
