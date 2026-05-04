import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Modal, TextInput, Select, Textarea, SimpleGrid, Stack, Group, Text,
  Autocomplete, Collapse, Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { applicationService, organizationService } from '../../services/api';
import type { Organization, OrganizationType } from '../../types';
import { STATUT_FORM_OPTIONS } from '../../constants/statuts';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { Button } from '../atoms/Button';
import { useI18n } from '../../i18n';

interface NewApplicationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

  const ORG_TYPE_OPTIONS = useMemo(() => [
    { value: 'CLIENT_FINAL', label: t('newApplication.orgTypes.CLIENT_FINAL') },
    { value: 'ESN', label: t('newApplication.orgTypes.ESN') },
    { value: 'CABINET_RECRUTEMENT', label: t('newApplication.orgTypes.CABINET_RECRUTEMENT') },
    { value: 'STARTUP', label: t('newApplication.orgTypes.STARTUP') },
    { value: 'PME', label: t('newApplication.orgTypes.PME') },
    { value: 'GRAND_COMPTE', label: t('newApplication.orgTypes.GRAND_COMPTE') },
    { value: 'PORTAGE', label: t('newApplication.orgTypes.PORTAGE') },
    { value: 'AUTRE', label: t('newApplication.orgTypes.AUTRE') },
  ], [t]);

  const STATUT_OPTIONS = useMemo(() => [
    ...STATUT_FORM_OPTIONS.map(opt => ({ ...opt, label: t(`status.${opt.value}`) }))
  ], [t]);

  const JOB_TYPE_OPTIONS = useMemo(() => [
    { value: 'CDI', label: t('newApplication.jobTypes.CDI') },
    { value: 'FREELANCE', label: t('newApplication.jobTypes.FREELANCE') },
    { value: 'CDD', label: t('newApplication.jobTypes.CDD') },
    { value: 'INTERN', label: t('newApplication.jobTypes.INTERN') },
  ], [t]);

const EMPTY_ORG = { name: '', type: 'AUTRE' as OrganizationType, city: '', website: '', linkedin_url: '', notes: '' };

export function NewApplicationModal({ onClose, onCreated }: NewApplicationModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: '',
    title: '',
    type: 'CDI',
    status: 'envoyee',
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

      if (!organizationId && newOrg.name.trim()) {
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
        setShowCreateOrg(false);
        notifications.show({ message: t('newApplication.notifOrgCreated', { name: full.name }), color: 'green' });
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

              <Collapse mounted={showCreateOrg}>
                <Paper p="md" withBorder radius="md">
              <Group justify="space-between" mb="sm">
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">▣ {t('newApplication.newOrgTitle')}</Text>
                <Button type="button" variant="ghost" size="small" onClick={() => setShowCreateOrg(false)}>{t('newApplication.collapse')}</Button>
              </Group>
              <SimpleGrid cols={2} spacing="sm">
                <TextInput label={t('newApplication.orgLabels.name')} value={newOrg.name} onChange={(e) => setNewOrg((n) => ({ ...n, name: e.target.value }))} />
                <Select label={t('newApplication.orgLabels.type')} data={ORG_TYPE_OPTIONS} value={newOrg.type} onChange={(v) => setNewOrg((n) => ({ ...n, type: (v as OrganizationType) || 'AUTRE' }))} />
                <TextInput label={t('newApplication.orgLabels.city')} value={newOrg.city} onChange={(e) => setNewOrg((n) => ({ ...n, city: e.target.value }))} />
                <TextInput label={t('newApplication.orgLabels.website')} value={newOrg.website} onChange={(e) => setNewOrg((n) => ({ ...n, website: e.target.value }))} />
                <TextInput label={t('newApplication.orgLabels.linkedin')} value={newOrg.linkedin_url} onChange={(e) => setNewOrg((n) => ({ ...n, linkedin_url: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                <Textarea label={t('newApplication.orgLabels.notes')} rows={2} value={newOrg.notes} onChange={(e) => setNewOrg((n) => ({ ...n, notes: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
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
                    label={t('newApplication.finalCustomer')}
                    placeholder={t('newApplication.finalCustomerPlaceholder')}
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
                    {t('newApplication.finalCustomerHint')}
                  </Text>
                </div>
              )}

              <SimpleGrid cols={2} spacing="sm">
                <Select
                  label={t('newApplication.type')}
                  data={JOB_TYPE_OPTIONS}
                  value={formData.type}
                  onChange={(v) => setFormData((f) => ({ ...f, type: v || 'CDI' }))}
                />
                <Select
                  label={t('newApplication.initialStatus')}
                  data={STATUT_OPTIONS}
                  value={formData.status}
                  onChange={(v) => setFormData((f) => ({ ...f, status: v || 'envoyee' }))}
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
              {loading ? t('newApplication.creating') : t('newApplication.createAction')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
