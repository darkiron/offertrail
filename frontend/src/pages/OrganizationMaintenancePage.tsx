import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Anchor, Badge, Button, Chip, Group, Paper, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Title,
} from '@mantine/core';
import { organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import type { Organization } from '../types';
import { useI18n } from '../i18n';
import classes from './OrganizationMaintenancePage.module.css';

type MaintenanceTab = 'merge' | 'split';

const organizationTypeOptions = (t: (k: string) => string): Array<{ value: Organization['type']; label: string }> => [
  { value: 'CLIENT_FINAL', label: t('newApplication.orgTypes.CLIENT_FINAL') },
  { value: 'ESN', label: t('newApplication.orgTypes.ESN') },
  { value: 'CABINET_RECRUTEMENT', label: t('newApplication.orgTypes.CABINET_RECRUTEMENT') },
  { value: 'STARTUP', label: t('newApplication.orgTypes.STARTUP') },
  { value: 'PME', label: t('newApplication.orgTypes.PME') },
  { value: 'GRAND_COMPTE', label: t('newApplication.orgTypes.GRAND_COMPTE') },
  { value: 'PORTAGE', label: t('newApplication.orgTypes.PORTAGE') },
  { value: 'AUTRE', label: t('newApplication.orgTypes.AUTRE') },
];

const getOrgLabel = (organization: Organization | null | undefined, t: (k: string) => string) => {
  if (!organization) {
    return t('organization.maintenance.noSelection');
  }
  return organization.city ? `${organization.name} - ${organization.city}` : organization.name;
};

const getSearchEmptyMessage = (query: string, kind: 'source' | 'target', t: (k: string) => string) => {
  if (query.trim()) {
    return t('organization.maintenance.searchEmpty');
  }
  return kind === 'source'
    ? t('organization.maintenance.sourceHint')
    : t('organization.maintenance.targetHint');
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
  const { t } = useI18n();
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

  useEffect(() => { document.title = t('organization.maintenance.title') + ' — OfferTrail'; }, [t]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organizationService.getAll();
        setOrganizations(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setError(t('organization.maintenance.loadError'));
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
      setSourceSearch(getOrgLabel(sourceOrganization, t));
    }
  }, [sourceOrganization, sourceSearch, t]);

  useEffect(() => {
    if (targetOrganization && !targetSearch) {
      setTargetSearch(getOrgLabel(targetOrganization, t));
    }
  }, [targetOrganization, targetSearch, t]);

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
      setError(t('organization.maintenance.mergeError'));
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
      setError(t('organization.maintenance.splitError'));
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
      <Anchor component={Link} to="/app/etablissements" c="dimmed" size="sm">← {t('common.backToOrganizations')}</Anchor>

      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="md">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('organization.maintenance.title')}</Text>
            <Title order={1}>{t('organization.maintenance.subtitle')}</Title>
            <Text c="dimmed">
              {t('organization.maintenance.copy')}
            </Text>
          </Stack>
          <SimpleGrid cols={2} spacing="sm">
            {[
              { label: t('organization.maintenance.statsPortfolio'), value: organizations.length, hint: t('organization.stats.total') },
              { label: t('organization.maintenance.statsVolume'), value: totalApplications, hint: t('nav.applications') },
              { label: t('organization.maintenance.statsComposites'), value: compositeOrganizations, hint: t('organization.maintenance.tabSplit') },
              { label: t('organization.maintenance.statsSource'), value: sourceOrganization?.name || t('common.noData'), hint: t('organization.maintenance.sourceLabel'), small: true },
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
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('newApplication.orgLabels.type')}</Text>
              <Group gap="xs">
                {[
                  { id: 'merge' as MaintenanceTab, label: t('organization.maintenance.tabMerge'), hint: t('organization.maintenance.tabMergeHint') },
                  { id: 'split' as MaintenanceTab, label: t('organization.maintenance.tabSplit'), hint: t('organization.maintenance.tabSplitHint') },
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
                <Text size="sm" fw={700}>{t('organization.maintenance.sourceLabel')}</Text>
                <TextInput
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder={t('organization.maintenance.sourceSearchPlaceholder')}
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
                        setSourceSearch(getOrgLabel(org, t));
                      }}
                    >
                      <div>
                        <Text size="sm" fw={700}>{org.name}</Text>
                        <Text size="xs" c="dimmed">{org.city || t('contacts.notDefined')} · {org.total_applications ?? 0} {t('nav.applications').toLowerCase()}</Text>
                      </div>
                      <Badge size="xs" variant="outline">{t('common.details')}</Badge>
                    </button>
                  )) : (
                    <Text size="xs" c="dimmed">{getSearchEmptyMessage(sourceSearch, 'source', t)}</Text>
                  )}
                </div>
              </Stack>

              {activeTab === 'merge' ? (
                <Stack gap="xs">
                  <Text size="sm" fw={700}>{t('organization.maintenance.targetLabel')}</Text>
                  <TextInput
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    placeholder={t('organization.maintenance.targetSearchPlaceholder')}
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
                          setTargetSearch(getOrgLabel(org, t));
                        }}
                      >
                        <div>
                          <Text size="sm" fw={700}>{org.name}</Text>
                          <Text size="xs" c="dimmed">{org.city || t('contacts.notDefined')} · {org.total_applications ?? 0} {t('nav.applications').toLowerCase()}</Text>
                        </div>
                        <Badge size="xs" variant="outline">{t('common.details')}</Badge>
                      </button>
                    )) : (
                      <Text size="xs" c="dimmed">{getSearchEmptyMessage(targetSearch, 'target', t)}</Text>
                    )}
                  </div>
                </Stack>
              ) : null}
            </SimpleGrid>

            {activeTab === 'merge' ? (
              <>
                <SimpleGrid cols={2} spacing="sm">
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('organization.maintenance.sourceToDelete')}</Text>
                    <Text fw={700} size="sm">{getOrgLabel(sourceOrganization, t)}</Text>
                    {sourceOrganization ? (
                      <Text size="xs" c="dimmed" mt={4}>{sourceOrganization.total_applications ?? 0} {t('nav.applications').toLowerCase()} · {sourceOrganization.response_rate ?? 0}% {t('dashboard.responseRate').toLowerCase()}</Text>
                    ) : <Text size="xs" c="dimmed">{t('organization.maintenance.sourceSelectHint')}</Text>}
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('organization.maintenance.finalTarget')}</Text>
                    <Text fw={700} size="sm">{getOrgLabel(targetOrganization, t)}</Text>
                    {targetOrganization ? (
                      <Text size="xs" c="dimmed" mt={4}>{targetOrganization.total_applications ?? 0} {t('nav.applications').toLowerCase()} · {targetOrganization.city || t('contacts.notDefined')}</Text>
                    ) : <Text size="xs" c="dimmed">{t('organization.maintenance.targetSelectHint')}</Text>}
                  </Paper>
                </SimpleGrid>

                <SimpleGrid cols={2} spacing="sm">
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('organization.maintenance.proposalsFromSource')}</Text>
                    {targetProposals.length > 0 ? (
                      <Stack gap="xs">
                        {targetProposals.map(({ organization: org, score }) => (
                          <Group key={org.id} justify="space-between">
                            <Stack gap={2}>
                              <Text size="sm" fw={700}>{org.name}</Text>
                              <Text size="xs" c="dimmed">{org.city || '-'} · {org.total_applications ?? 0} · score {score}</Text>
                            </Stack>
                            <Button size="xs" variant="outline" onClick={() => { setTargetOrgId(String(org.id)); setTargetSearch(getOrgLabel(org, t)); }}>{t('common.details')}</Button>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">{t('organization.maintenance.selectSourceHint')}</Text>
                    )}
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('organization.maintenance.proposalsFromTarget')}</Text>
                    {sourceProposals.length > 0 ? (
                      <Stack gap="xs">
                        {sourceProposals.map(({ organization: org, score }) => (
                          <Group key={org.id} justify="space-between">
                            <Stack gap={2}>
                              <Text size="sm" fw={700}>{org.name}</Text>
                              <Text size="xs" c="dimmed">{org.city || '-'} · {org.total_applications ?? 0} · score {score}</Text>
                            </Stack>
                            <Button size="xs" variant="outline" onClick={() => { setSourceOrgId(String(org.id)); setSourceSearch(getOrgLabel(org, t)); }}>{t('common.details')}</Button>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">{t('organization.maintenance.selectTargetHint')}</Text>
                    )}
                  </Paper>
                </SimpleGrid>

                <Group>
                  <Button
                    variant="filled"
                    disabled={!sourceOrgId || !targetOrgId || submitting}
                    onClick={handleMerge}
                  >
                    {t('organization.maintenance.mergeAction')}
                  </Button>
                  {sourceOrganization ? (
                    <Button component={Link} to={`/organizations/${sourceOrganization.id}`} variant="outline">
                      {t('organization.maintenance.openSourceAction')}
                    </Button>
                  ) : null}
                </Group>
              </>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label={t('organization.maintenance.newNameLabel')}
                    value={splitForm.name}
                    onChange={(e) => setSplitForm((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Ex: Mr Auto"
                  />
                  <Select
                    label={t('newApplication.orgLabels.type')}
                    value={splitForm.type}
                    onChange={(v) => setSplitForm((c) => ({ ...c, type: (v ?? 'AUTRE') as Organization['type'] }))}
                    data={organizationTypeOptions(t)}
                  />
                  <TextInput
                    label={t('newApplication.orgLabels.city')}
                    value={splitForm.city}
                    onChange={(e) => setSplitForm((c) => ({ ...c, city: e.target.value }))}
                    placeholder="Paris"
                  />
                  <TextInput
                    label={t('newApplication.orgLabels.website')}
                    value={splitForm.website}
                    onChange={(e) => setSplitForm((c) => ({ ...c, website: e.target.value }))}
                    placeholder="https://..."
                  />
                  <TextInput
                    label={t('newApplication.orgLabels.linkedin')}
                    value={splitForm.linkedin_url}
                    onChange={(e) => setSplitForm((c) => ({ ...c, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/company/..."
                  />
                  <div />
                  <Textarea
                    label={t('newApplication.orgLabels.notes')}
                    value={splitForm.notes}
                    onChange={(e) => setSplitForm((c) => ({ ...c, notes: e.target.value }))}
                    placeholder={t('organization.maintenance.tabSplitHint')}
                    style={{ gridColumn: '1 / -1' }}
                  />
                </SimpleGrid>

                <Paper p="md" radius="md" className={classes.infoCard}>
                  <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">{t('organization.maintenance.splitInfoTitle')}</Text>
                  <Text size="sm" c="dimmed">
                    {t('organization.maintenance.splitInfoCopy')}
                  </Text>
                </Paper>

                <Group>
                  <Button
                    variant="filled"
                    disabled={!sourceOrgId || !splitForm.name.trim() || submitting}
                    onClick={handleSplit}
                  >
                    {t('organization.maintenance.splitAction')}
                  </Button>
                  <Button variant="outline" disabled={submitting} onClick={resetSplitForm}>
                    {t('organization.maintenance.resetAction')}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="md">{t('organization.maintenance.quickReadTitle')}</Text>
          <Stack gap="md">
            {[
              { title: t('organization.maintenance.tipMergeTitle'), text: t('organization.maintenance.tipMergeText') },
              { title: t('organization.maintenance.tipSplitTitle'), text: t('organization.maintenance.tipSplitText') },
              { title: t('organization.maintenance.tipHabitTitle'), text: t('organization.maintenance.tipHabitText') },
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
