import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Anchor, Badge, Group, Chip, Paper, Select, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import type { Organization, OrganizationType } from '../types';
import classes from './OrganizationsPage.module.css';

type OrganizationTab = 'all' | 'engaged' | 'responsive' | 'watchlist';

const organizationTypeLabels: Record<OrganizationType, string> = {
  CLIENT_FINAL: 'Client final',
  ESN: 'ESN',
  CABINET_RECRUTEMENT: 'Cabinet',
  STARTUP: 'Startup',
  PME: 'PME',
  GRAND_COMPTE: 'Grand compte',
  PORTAGE: 'Portage',
  AUTRE: 'Autre',
};

const tabDefinitions: Array<{ id: OrganizationTab; label: string; hint: string }> = [
  { id: 'all', label: 'Tous', hint: 'Vue complete du portefeuille' },
  { id: 'engaged', label: 'Actifs', hint: 'Organisations avec candidatures' },
  { id: 'responsive', label: 'Repondent', hint: 'Taux de reponse >= 35%' },
  { id: 'watchlist', label: 'A surveiller', hint: 'Activite sans retour significatif' },
];

const organizationTypes: OrganizationType[] = [
  'CLIENT_FINAL', 'ESN', 'CABINET_RECRUTEMENT', 'STARTUP',
  'PME', 'GRAND_COMPTE', 'PORTAGE', 'AUTRE',
];

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OrganizationTab>('all');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Établissements — OfferTrail';
  }, []);

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

  const getHealthBucket = (organization: Organization) => {
    if ((organization.response_rate || 0) >= 45) {
      return { color: 'green', label: 'Dynamique saine' };
    }
    if ((organization.response_rate || 0) >= 20) {
      return { color: 'yellow', label: 'A entretenir' };
    }
    return { color: 'red', label: 'Relation froide' };
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
      {/* Hero + Sidebar */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Pipeline organisations</Text>
          <Title order={1} mt="xs">Etablissements</Title>
          <Text c="dimmed" mt="sm" maw={640}>
            Une vue opérationnelle du portefeuille : filtres utiles, onglets pour prioriser, et cartes
            resserrées pour repérer rapidement qui mérite de l&apos;attention.
          </Text>

          <Group mt="lg" mb="xl">
            <Anchor component={Link} to="/organizations/maintenance">
              <Badge variant="filled" size="md" radius="xl">Maintenance ETS →</Badge>
            </Anchor>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {[
              { label: 'Total', value: organizations.length, hint: 'établissements chargés' },
              { label: 'Actifs', value: engagedOrganizations.length, hint: 'avec au moins une candidature' },
              { label: 'Taux moyen', value: `${averageResponseRate}%`, hint: 'réponse moyenne' },
              { label: 'Volume', value: totalApplications, hint: 'candidatures cumulées' },
            ].map((kpi) => (
              <div key={kpi.label} className={classes.kpi}>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{kpi.label}</Text>
                <Text size="xl" fw={700} mt={6}>{kpi.value}</Text>
                <Text size="xs" c="dimmed" mt={4}>{kpi.hint}</Text>
              </div>
            ))}
          </SimpleGrid>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="lg">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Priorité du moment</Text>
              <Text size="xl" fw={700}>{watchlistOrganizations.length}</Text>
              <Text size="sm" c="dimmed">organisations à surveiller ou relancer</Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Lecture rapide</Text>
              <Text size="sm" c="dimmed">
                Utilise les onglets pour séparer les comptes engagés, ceux qui répondent, et les relations plus froides.
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Filtre appliqué</Text>
              <Text size="sm" c="dimmed">
                {typeFilter ? organizationTypeLabels[typeFilter as OrganizationType] : 'Tous les types'}
                {search ? ` · recherche "${search}"` : ''}
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Filters */}
      <Paper p="lg" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          <TextInput
            placeholder="Rechercher un établissement, une ville, un signal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="Tous les types"
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
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Tri visuel</Text>
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
            {loading ? 'Chargement...' : `${visibleOrganizations.length} résultat(s)`}
          </Text>
        </Group>

        {loading ? (
          <Spinner />
        ) : error ? (
          <Paper p="md" radius="md" className={classes.alertCard}>
            <Text c="red">{error}</Text>
          </Paper>
        ) : visibleOrganizations.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">Aucun établissement ne correspond aux filtres actuels.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {visibleOrganizations.map((organization) => {
              const positiveRate = getPositiveRate(organization);
              const rejectionRate = getRejectionRate(organization);
              const health = getHealthBucket(organization);
              const notePreview = organization.notes?.trim()
                ? organization.notes.trim().slice(0, 110)
                : 'Aucune note disponible pour cet établissement.';

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
                    <Text size="sm" c="dimmed">{organization.city || 'Ville non renseignée'}</Text>
                    {organization.website ? (
                      <Anchor
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Voir le site
                      </Anchor>
                    ) : null}
                  </Group>

                  <Text size="sm" c="dimmed" mt="sm" className={classes.notePreview}>
                    {notePreview}
                    {organization.notes && organization.notes.trim().length > 110 ? '...' : ''}
                  </Text>

                  <SimpleGrid cols={2} spacing="xs" mt="md">
                    {[
                      { label: 'Candidatures', value: organization.total_applications ?? 0, hint: 'activité cumulée' },
                      { label: 'Taux de réponse', value: `${organization.response_rate ?? 0}%`, progress: organization.response_rate ?? 0 },
                      { label: 'Taux positif', value: `${positiveRate}%`, hint: 'retours constructifs' },
                      { label: 'Taux de rejet', value: `${rejectionRate}%`, hint: 'signal à surveiller' },
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
                      <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Dernière interaction</Text>
                      <Text size="sm" c="dimmed">{formatDate(organization.updated_at)}</Text>
                    </Stack>
                    <Text size="sm" c="dimmed">Ouvrir la fiche →</Text>
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
