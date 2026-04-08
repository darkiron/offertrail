import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Modal, TextInput, Select, Textarea, SimpleGrid, Stack, Group, Text,
  Autocomplete, Collapse, Paper,
} from '@mantine/core';
import { applicationService, organizationService } from '../../services/api';
import type { Organization, OrganizationType } from '../../types';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { Button } from '../atoms/Button';
import { useI18n } from '../../i18n';

interface NewApplicationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const ORG_TYPE_OPTIONS = [
  { value: 'CLIENT_FINAL', label: 'Client final' },
  { value: 'ESN', label: 'ESN' },
  { value: 'CABINET_RECRUTEMENT', label: 'Cabinet' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'PME', label: 'PME' },
  { value: 'GRAND_COMPTE', label: 'Grand compte' },
  { value: 'PORTAGE', label: 'Portage' },
  { value: 'AUTRE', label: 'Autre' },
];

const EMPTY_ORG = { name: '', type: 'AUTRE' as OrganizationType, city: '', website: '', linkedin_url: '', notes: '' };

export function NewApplicationModal({ onClose, onCreated }: NewApplicationModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: '',
    title: '',
    type: 'CDI',
    status: 'APPLIED',
    source: '',
    job_url: '',
    applied_at: new Date().toISOString().split('T')[0],
    next_followup_at: '',
    org_type: 'AUTRE' as OrganizationType,
  });
  const [newOrg, setNewOrg] = useState(EMPTY_ORG);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [finalCustomerSearch, setFinalCustomerSearch] = useState('');
  const [selectedFinalCustomer, setSelectedFinalCustomer] = useState<Organization | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const matchedOrg = useMemo(
    () => organizations.find((o) => o.name.toLowerCase() === formData.company.toLowerCase()) || selectedOrg,
    [organizations, formData.company, selectedOrg],
  );

  const effectiveOrgType = matchedOrg?.type || (showCreateOrg ? newOrg.type : formData.org_type);
  const needsFinalCustomer = effectiveOrgType === 'ESN' || effectiveOrgType === 'CABINET_RECRUTEMENT';

  const orgAutocompleteData = useMemo(
    () => organizations.filter((o) => o.name.toLowerCase().includes(formData.company.toLowerCase())).slice(0, 6).map((o) => o.name),
    [organizations, formData.company],
  );

  const finalCustomerData = useMemo(
    () => organizations
      .filter((o) => !['ESN', 'CABINET_RECRUTEMENT', 'PORTAGE'].includes(o.type))
      .filter((o) => o.name.toLowerCase().includes(finalCustomerSearch.toLowerCase()))
      .slice(0, 6)
      .map((o) => o.name),
    [organizations, finalCustomerSearch],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let organizationId = selectedOrg?.id || matchedOrg?.id || null;

      if (!organizationId && showCreateOrg && newOrg.name.trim()) {
        const created = await organizationService.create({
          ...newOrg,
          name: newOrg.name.trim(),
          city: newOrg.city || null,
          website: newOrg.website || null,
          linkedin_url: newOrg.linkedin_url || null,
          notes: newOrg.notes || null,
        });
        const full = await organizationService.getById(created.id);
        setOrganizations((current) => [full, ...current]);
        organizationId = full.id;
      }

      await applicationService.createApplication({
        ...formData,
        company: formData.company.trim(),
        org_type: matchedOrg?.type || newOrg.type || formData.org_type,
        organization_id: organizationId,
        final_customer_organization_id: selectedFinalCustomer?.id || null,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 402) { onClose(); navigate('/app/pricing?reason=limit_reached'); return; }
        if (err.response?.status === 401) { onClose(); navigate('/login'); return; }
        setError(err.response?.data?.detail || t('newApplication.createError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened onClose={onClose} size="xl" title={
      <Stack gap={2}>
        <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('newApplication.kicker')}</Text>
        <Text size="xl" fw={700}>{t('newApplication.title')}</Text>
      </Stack>
    }>
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Stack gap="md">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">◎ {t('newApplication.core')}</Text>

              <div>
                <Autocomplete
                  label={t('newApplication.organization')}
                  placeholder={t('newApplication.organizationPlaceholder')}
                  value={formData.company}
                  onChange={(val) => {
                    setFormData((f) => ({ ...f, company: val }));
                    const match = organizations.find((o) => o.name === val);
                    if (match) setSelectedOrg(match);
                    else { setSelectedOrg(null); setShowCreateOrg(false); }
                    setNewOrg((n) => ({ ...n, name: val }));
                  }}
                  data={orgAutocompleteData}
                />
                {matchedOrg && (
                  <Group gap="xs" mt="xs">
                    <OrganizationTypeBadge type={matchedOrg.type} size="xs" />
                    <ProbityBadge score={matchedOrg.probity_score} level={matchedOrg.probity_level} showScore={false} />
                    <Text size="sm" c="dimmed">{matchedOrg.name}</Text>
                  </Group>
                )}
                {!matchedOrg && formData.company && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    mt="xs"
                    onClick={() => { setShowCreateOrg((v) => !v); setNewOrg((n) => ({ ...n, name: formData.company })); }}
                  >
                    {t('newApplication.createOrg')} "{formData.company}"
                  </Button>
                )}
              </div>

              <Collapse in={showCreateOrg}>
                <Paper p="md" withBorder radius="md">
                  <Group justify="space-between" mb="sm">
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">▣ Nouvel ETS</Text>
                    <Button type="button" variant="ghost" size="small" onClick={() => setShowCreateOrg(false)}>Replier</Button>
                  </Group>
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput label="Nom" value={newOrg.name} onChange={(e) => setNewOrg((n) => ({ ...n, name: e.target.value }))} />
                    <Select label="Type" data={ORG_TYPE_OPTIONS} value={newOrg.type} onChange={(v) => setNewOrg((n) => ({ ...n, type: (v as OrganizationType) || 'AUTRE' }))} />
                    <TextInput label="Ville" value={newOrg.city} onChange={(e) => setNewOrg((n) => ({ ...n, city: e.target.value }))} />
                    <TextInput label="Site web" value={newOrg.website} onChange={(e) => setNewOrg((n) => ({ ...n, website: e.target.value }))} />
                    <TextInput label="LinkedIn" value={newOrg.linkedin_url} onChange={(e) => setNewOrg((n) => ({ ...n, linkedin_url: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                    <Textarea label="Notes" rows={2} value={newOrg.notes} onChange={(e) => setNewOrg((n) => ({ ...n, notes: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                  </SimpleGrid>
                </Paper>
              </Collapse>

              <TextInput
                label={t('newApplication.jobTitle')}
                required
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              />

              {needsFinalCustomer && (
                <div>
                  <Autocomplete
                    label="Client final"
                    placeholder="Rechercher le client final"
                    value={finalCustomerSearch}
                    onChange={(val) => {
                      setFinalCustomerSearch(val);
                      const match = organizations.find((o) => o.name === val);
                      setSelectedFinalCustomer(match || null);
                    }}
                    data={finalCustomerData}
                  />
                  {selectedFinalCustomer && (
                    <Group gap="xs" mt="xs">
                      <OrganizationTypeBadge type={selectedFinalCustomer.type} size="xs" />
                      <Text size="sm" c="dimmed">{selectedFinalCustomer.name}</Text>
                    </Group>
                  )}
                  <Text size="xs" c="dimmed" mt="xs">
                    Lien utile quand la candidature passe par un cabinet ou une ESN.
                  </Text>
                </div>
              )}

              <SimpleGrid cols={2} spacing="sm">
                <Select
                  label={t('newApplication.type')}
                  data={[
                    { value: 'CDI', label: 'CDI' },
                    { value: 'FREELANCE', label: 'FREELANCE' },
                    { value: 'CDD', label: 'CDD' },
                    { value: 'INTERN', label: 'INTERNSHIP' },
                  ]}
                  value={formData.type}
                  onChange={(v) => setFormData((f) => ({ ...f, type: v || 'CDI' }))}
                />
                <Select
                  label={t('newApplication.initialStatus')}
                  data={[
                    { value: 'INTERESTED', label: 'INTERESTED' },
                    { value: 'APPLIED', label: 'APPLIED' },
                    { value: 'INTERVIEW', label: 'INTERVIEW' },
                    { value: 'OFFER', label: 'OFFER' },
                    { value: 'REJECTED', label: 'REJECTED' },
                  ]}
                  value={formData.status}
                  onChange={(v) => setFormData((f) => ({ ...f, status: v || 'APPLIED' }))}
                />
              </SimpleGrid>
            </Stack>

            <Stack gap="md">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">◷ {t('newApplication.tracking')}</Text>
              <TextInput
                label={t('newApplication.appliedAt')}
                type="date"
                value={formData.applied_at}
                onChange={(e) => setFormData((f) => ({ ...f, applied_at: e.target.value }))}
              />
              <TextInput
                label={t('newApplication.nextFollowup')}
                type="date"
                value={formData.next_followup_at}
                onChange={(e) => setFormData((f) => ({ ...f, next_followup_at: e.target.value }))}
              />
              <TextInput
                label={t('newApplication.source')}
                placeholder={t('newApplication.sourcePlaceholder')}
                value={formData.source}
                onChange={(e) => setFormData((f) => ({ ...f, source: e.target.value }))}
              />
              <TextInput
                label={t('newApplication.jobUrl')}
                placeholder={t('newApplication.jobUrlPlaceholder')}
                value={formData.job_url}
                onChange={(e) => setFormData((f) => ({ ...f, job_url: e.target.value }))}
              />
              <Text size="xs" c="dimmed">{t('newApplication.tip')}</Text>
            </Stack>
          </SimpleGrid>

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Création...' : t('newApplication.createAction')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
