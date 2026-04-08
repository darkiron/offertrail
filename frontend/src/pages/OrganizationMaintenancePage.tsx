import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Anchor, Badge, Button, Chip, Group, Paper, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Title,
} from '@mantine/core';
import { organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import type { Organization } from '../types';
import classes from './OrganizationMaintenancePage.module.css';

type MaintenanceTab = 'merge' | 'split';

const organizationTypeOptions: Array<{ value: Organization['type']; label: string }> = [
  { value: 'CLIENT_FINAL', label: 'Client final' },
  { value: 'ESN', label: 'ESN' },
  { value: 'CABINET_RECRUTEMENT', label: 'Cabinet' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'PME', label: 'PME' },
  { value: 'GRAND_COMPTE', label: 'Grand compte' },
  { value: 'PORTAGE', label: 'Portage' },
  { value: 'AUTRE', label: 'Autre' },
];

const getOrgLabel = (organization?: Organization | null) => {
  if (!organization) {
    return 'Aucun ETS selectionne';
  }
  return organization.city ? `${organization.name} - ${organization.city}` : organization.name;
};

const getSearchEmptyMessage = (query: string, kind: 'source' | 'target') => {
  if (query.trim()) {
    return 'Aucun ETS ne correspond a cette recherche.';
  }
  return kind === 'source'
    ? 'Commence a taper pour choisir l ETS source.'
    : 'Commence a taper pour choisir l ETS cible.';
};

const getOrganizationSearchBlob = (organization: Organization) => {
  return [
    organization.name,
    organization.city || '',
    organization.website || '',
    organization.linkedin_url || '',
    organization.notes || '',
  ].join(' ').toLowerCase();
};

const scoreOrganizationMatch = (reference: Organization, candidate: Organization) => {
  const sourceName = reference.name.toLowerCase();
  const candidateName = candidate.name.toLowerCase();
  let score = 0;

  if (candidateName === sourceName) score += 12;
  if (candidateName.includes(sourceName) || sourceName.includes(candidateName)) score += 8;
  if (reference.city && candidate.city && reference.city.toLowerCase() === candidate.city.toLowerCase()) score += 4;
  if ((reference.website || '') && candidate.website && reference.website === candidate.website) score += 6;
  if ((reference.linkedin_url || '') && candidate.linkedin_url && reference.linkedin_url === candidate.linkedin_url) score += 6;
  if ((reference.total_applications ?? 0) === 0 || (candidate.total_applications ?? 0) === 0) score += 1;

  return score;
};

export const OrganizationMaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceFromQuery = searchParams.get('source') || '';
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MaintenanceTab>('merge');
  const [sourceOrgId, setSourceOrgId] = useState(sourceFromQuery);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [splitForm, setSplitForm] = useState({
    name: '',
    type: 'AUTRE' as Organization['type'],
    city: '',
    website: '',
    linkedin_url: '',
    notes: '',
  });

  useEffect(() => { document.title = 'Maintenance entreprises — OfferTrail'; }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organizationService.getAll();
        setOrganizations(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setError('Impossible de charger les ETS pour la maintenance.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (sourceFromQuery) {
      setSourceOrgId(sourceFromQuery);
    }
  }, [sourceFromQuery]);

  useEffect(() => {
    if (sourceOrgId === targetOrgId) {
      setTargetOrgId('');
    }
  }, [sourceOrgId, targetOrgId]);

  const sourceOrganization = useMemo(
    () => organizations.find((org) => String(org.id) === sourceOrgId) ?? null,
    [organizations, sourceOrgId],
  );

  const targetOptions = useMemo(
    () => organizations.filter((org) => String(org.id) !== sourceOrgId),
    [organizations, sourceOrgId],
  );

  const targetOrganization = useMemo(
    () => organizations.find((org) => String(org.id) === targetOrgId) ?? null,
    [organizations, targetOrgId],
  );

  const sourceSearchResults = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    const list = query
      ? organizations.filter((org) => getOrganizationSearchBlob(org).includes(query))
      : [];
    return list.slice(0, 8);
  }, [organizations, sourceSearch]);

  const targetSearchResults = useMemo(() => {
    const query = targetSearch.trim().toLowerCase();
    const list = query
      ? targetOptions.filter((org) => getOrganizationSearchBlob(org).includes(query))
      : [];
    return list.slice(0, 8);
  }, [targetOptions, targetSearch]);

  const targetProposals = useMemo(() => {
    if (!sourceOrganization) return [];
    return targetOptions
      .map((org) => ({ organization: org, score: scoreOrganizationMatch(sourceOrganization, org) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.organization.name.localeCompare(b.organization.name))
      .slice(0, 5);
  }, [sourceOrganization, targetOptions]);

  const sourceProposals = useMemo(() => {
    if (!targetOrganization) return [];
    return organizations
      .filter((org) => org.id !== targetOrganization.id)
      .map((org) => ({ organization: org, score: scoreOrganizationMatch(targetOrganization, org) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.organization.name.localeCompare(b.organization.name))
      .slice(0, 5);
  }, [organizations, targetOrganization]);

  useEffect(() => {
    if (sourceOrganization && !sourceSearch) {
      setSourceSearch(getOrgLabel(sourceOrganization));
    }
  }, [sourceOrganization, sourceSearch]);

  useEffect(() => {
    if (targetOrganization && !targetSearch) {
      setTargetSearch(getOrgLabel(targetOrganization));
    }
  }, [targetOrganization, targetSearch]);

  const resetSplitForm = () => {
    setSplitForm({ name: '', type: 'AUTRE', city: '', website: '', linkedin_url: '', notes: '' });
  };

  const handleMerge = async () => {
    if (!sourceOrgId || !targetOrgId) return;
    setSubmitting(true);
    setError(null);
    try {
      await organizationService.merge(Number(sourceOrgId), Number(targetOrgId));
      navigate(`/app/etablissements/${targetOrgId}`);
    } catch {
      setError('La fusion a echoue. Verifie les ETS selectionnes puis recommence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSplit = async () => {
    if (!sourceOrgId || !splitForm.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await organizationService.split(Number(sourceOrgId), { ...splitForm, move_contacts: true });
      resetSplitForm();
      navigate(`/app/etablissements/${created.id}`);
    } catch {
      setError('La scission a echoue. Complete le nouvel ETS puis recommence.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalApplications = organizations.reduce((sum, org) => sum + (org.total_applications ?? 0), 0);
  const compositeOrganizations = organizations.filter((org) => org.name.includes(' - ') || org.name.includes('/')).length;

  if (loading) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder><Spinner /></Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Anchor component={Link} to="/organizations" c="dimmed" size="sm">← Retour aux établissements</Anchor>

      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="md">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Maintenance ETS</Text>
            <Title order={1}>Fusionner ou scinder les établissements</Title>
            <Text c="dimmed">
              Utilise cet espace quand une fiche doit être rattachée à la bonne entreprise ou découpée en un nouvel ETS.
            </Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" size="sm">Outil dédié</Badge>
              <Badge variant="light" size="sm">Fusion des doublons</Badge>
              <Badge variant="light" size="sm">Création d&apos;un ETS séparé</Badge>
            </Group>
          </Stack>
          <SimpleGrid cols={2} spacing="sm">
            {[
              { label: 'Portefeuille', value: organizations.length, hint: 'ETS disponibles' },
              { label: 'Volume associé', value: totalApplications, hint: 'candidatures' },
              { label: 'Composites', value: compositeOrganizations, hint: 'signaux de scission' },
              { label: 'Source active', value: sourceOrganization?.name || 'Aucune', hint: 'sélection courante', small: true },
            ].map((stat) => (
              <Paper key={stat.label} p="sm" radius="md" withBorder>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{stat.label}</Text>
                <Text fw={800} mt={6} className={stat.small ? classes.statsValueSmall : classes.statsValue}>{stat.value}</Text>
                <Text size="xs" c="dimmed" mt={4}>{stat.hint}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </SimpleGrid>
      </Paper>

      {error ? <Alert color="red">{error}</Alert> : null}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Mode</Text>
              <Group gap="xs">
                {[
                  { id: 'merge' as MaintenanceTab, label: 'Fusion', hint: 'Rattache un ETS au bon enregistrement' },
                  { id: 'split' as MaintenanceTab, label: 'Scission', hint: 'Crée un nouvel ETS depuis un composite' },
                ].map((tab) => (
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

            <SimpleGrid cols={{ base: 1, sm: activeTab === 'merge' ? 2 : 1 }} spacing="md">
              <Stack gap="xs">
                <Text size="sm" fw={700}>ETS source</Text>
                <TextInput
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder="Recherche source: nom, ville, site..."
                />
                <div className={classes.searchResults}>
                  {sourceSearchResults.length > 0 ? sourceSearchResults.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      className={classes.searchItem}
                      data-selected={sourceOrgId === String(org.id) ? true : undefined}
                      onClick={() => {
                        setSourceOrgId(String(org.id));
                        setSourceSearch(getOrgLabel(org));
                      }}
                    >
                      <div>
                        <Text size="sm" fw={700}>{org.name}</Text>
                        <Text size="xs" c="dimmed">{org.city || 'Ville non renseignée'} · {org.total_applications ?? 0} candidature(s)</Text>
                      </div>
                      <Badge size="xs" variant="outline">Choisir</Badge>
                    </button>
                  )) : (
                    <Text size="xs" c="dimmed">{getSearchEmptyMessage(sourceSearch, 'source')}</Text>
                  )}
                </div>
              </Stack>

              {activeTab === 'merge' ? (
                <Stack gap="xs">
                  <Text size="sm" fw={700}>ETS cible</Text>
                  <TextInput
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    placeholder="Recherche cible: nom, ville, site..."
                  />
                  <div className={classes.searchResults}>
                    {targetSearchResults.length > 0 ? targetSearchResults.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        className={classes.searchItem}
                        data-selected={targetOrgId === String(org.id) ? true : undefined}
                        onClick={() => {
                          setTargetOrgId(String(org.id));
                          setTargetSearch(getOrgLabel(org));
                        }}
                      >
                        <div>
                          <Text size="sm" fw={700}>{org.name}</Text>
                          <Text size="xs" c="dimmed">{org.city || 'Ville non renseignée'} · {org.total_applications ?? 0} candidature(s)</Text>
                        </div>
                        <Badge size="xs" variant="outline">Choisir</Badge>
                      </button>
                    )) : (
                      <Text size="xs" c="dimmed">{getSearchEmptyMessage(targetSearch, 'target')}</Text>
                    )}
                  </div>
                </Stack>
              ) : null}
            </SimpleGrid>

            {activeTab === 'merge' ? (
              <>
                <SimpleGrid cols={2} spacing="sm">
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Source à supprimer</Text>
                    <Text fw={700} size="sm">{getOrgLabel(sourceOrganization)}</Text>
                    {sourceOrganization ? (
                      <Text size="xs" c="dimmed" mt={4}>{sourceOrganization.total_applications ?? 0} candidature(s) · {sourceOrganization.response_rate ?? 0}% réponse</Text>
                    ) : <Text size="xs" c="dimmed">Sélectionne d&apos;abord l&apos;ETS à absorber.</Text>}
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Cible finale</Text>
                    <Text fw={700} size="sm">{getOrgLabel(targetOrganization)}</Text>
                    {targetOrganization ? (
                      <Text size="xs" c="dimmed" mt={4}>{targetOrganization.total_applications ?? 0} candidature(s) · {targetOrganization.city || 'Ville non renseignée'}</Text>
                    ) : <Text size="xs" c="dimmed">Choisis l&apos;ETS qui doit conserver l&apos;historique.</Text>}
                  </Paper>
                </SimpleGrid>

                <SimpleGrid cols={2} spacing="sm">
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Propositions depuis la source</Text>
                    {targetProposals.length > 0 ? (
                      <Stack gap="xs">
                        {targetProposals.map(({ organization: org, score }) => (
                          <Group key={org.id} justify="space-between">
                            <Stack gap={2}>
                              <Text size="sm" fw={700}>{org.name}</Text>
                              <Text size="xs" c="dimmed">{org.city || '-'} · {org.total_applications ?? 0} · score {score}</Text>
                            </Stack>
                            <Button size="xs" variant="outline" onClick={() => { setTargetOrgId(String(org.id)); setTargetSearch(getOrgLabel(org)); }}>Choisir</Button>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">Sélectionne une source pour voir les cibles probables.</Text>
                    )}
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Propositions depuis la cible</Text>
                    {sourceProposals.length > 0 ? (
                      <Stack gap="xs">
                        {sourceProposals.map(({ organization: org, score }) => (
                          <Group key={org.id} justify="space-between">
                            <Stack gap={2}>
                              <Text size="sm" fw={700}>{org.name}</Text>
                              <Text size="xs" c="dimmed">{org.city || '-'} · {org.total_applications ?? 0} · score {score}</Text>
                            </Stack>
                            <Button size="xs" variant="outline" onClick={() => { setSourceOrgId(String(org.id)); setSourceSearch(getOrgLabel(org)); }}>Choisir</Button>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">Choisis une cible pour voir quelles sources proches pourraient y être fusionnées.</Text>
                    )}
                  </Paper>
                </SimpleGrid>

                <Group>
                  <Button
                    variant="filled"
                    disabled={!sourceOrgId || !targetOrgId || submitting}
                    onClick={handleMerge}
                  >
                    Fusionner maintenant
                  </Button>
                  {sourceOrganization ? (
                    <Button component={Link} to={`/organizations/${sourceOrganization.id}`} variant="outline">
                      Ouvrir la fiche source
                    </Button>
                  ) : null}
                </Group>
              </>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Nom du nouvel ETS"
                    value={splitForm.name}
                    onChange={(e) => setSplitForm((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Ex: Mr Auto"
                  />
                  <Select
                    label="Type"
                    value={splitForm.type}
                    onChange={(v) => setSplitForm((c) => ({ ...c, type: (v ?? 'AUTRE') as Organization['type'] }))}
                    data={organizationTypeOptions}
                  />
                  <TextInput
                    label="Ville"
                    value={splitForm.city}
                    onChange={(e) => setSplitForm((c) => ({ ...c, city: e.target.value }))}
                    placeholder="Paris"
                  />
                  <TextInput
                    label="Site web"
                    value={splitForm.website}
                    onChange={(e) => setSplitForm((c) => ({ ...c, website: e.target.value }))}
                    placeholder="https://..."
                  />
                  <TextInput
                    label="LinkedIn"
                    value={splitForm.linkedin_url}
                    onChange={(e) => setSplitForm((c) => ({ ...c, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/company/..."
                  />
                  <div />
                  <Textarea
                    label="Notes"
                    value={splitForm.notes}
                    onChange={(e) => setSplitForm((c) => ({ ...c, notes: e.target.value }))}
                    placeholder="Contexte de la scission et informations utiles."
                    style={{ gridColumn: '1 / -1' }}
                  />
                </SimpleGrid>

                <Paper p="md" radius="md" className={classes.infoCard}>
                  <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Ce que fera la scission</Text>
                  <Text size="sm" c="dimmed">
                    Le nouvel ETS sera créé puis les candidatures et contacts de la fiche source seront déplacés vers lui.
                  </Text>
                </Paper>

                <Group>
                  <Button
                    variant="filled"
                    disabled={!sourceOrgId || !splitForm.name.trim() || submitting}
                    onClick={handleSplit}
                  >
                    Créer et scinder
                  </Button>
                  <Button variant="outline" disabled={submitting} onClick={resetSplitForm}>
                    Réinitialiser
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">Lecture rapide</Text>
          <Stack gap="md">
            {[
              { title: 'Quand fusionner', text: 'Même entreprise, orthographes proches, ou fiche vide à rattacher à un ETS déjà propre.' },
              { title: 'Quand scinder', text: 'Un enregistrement mélange un cabinet et son client, ou plusieurs marques distinctes dans le même nom.' },
              { title: 'Bon réflexe', text: "Ouvre d'abord la fiche source pour vérifier les candidatures rattachées, puis lance la maintenance ici." },
            ].map((tip) => (
              <Paper key={tip.title} p="md" radius="md" withBorder>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{tip.title}</Text>
                <Text size="sm" c="dimmed">{tip.text}</Text>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
};

export default OrganizationMaintenancePage;
