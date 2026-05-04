import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, Checkbox, SimpleGrid, Stack, Group, Text, Autocomplete,
} from '@mantine/core';
import type { Contact, Organization } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { Button } from '../atoms/Button';
import OrganizationEditModal from './OrganizationEditModal';
import { useI18n } from '../../i18n';

interface ContactCreateModalProps {
  onClose: () => void;
  onCreated: (contact?: Contact) => void;
}

export function ContactCreateModal({ onClose, onCreated }: ContactCreateModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Contact>>({
    first_name: '', last_name: '', email: '', phone: '', role: '',
    is_recruiter: 0, linkedin_url: '', notes: '', organization_id: null,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const autocompleteData = useMemo(() => {
    if (!query.trim()) return [];
    const lowered = query.toLowerCase();
    return organizations
      .filter((org) => org.name.toLowerCase().includes(lowered))
      .slice(0, 6)
      .map((org) => ({ value: org.name, org }));
  }, [organizations, query]);

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.name === query) || null,
    [organizations, query],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await contactService.create(form);
      const full = await contactService.getById(created.id);
      onCreated(full);
      onClose();
    } catch (submitError: unknown) {
      setError((axios.isAxiosError(submitError) && submitError.response?.data?.detail) || t('contacts.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal opened onClose={onClose} size="lg" title={
        <Stack gap={2}>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('contacts.createKicker')}</Text>
          <Text size="xl" fw={700}>{t('contacts.createTitle')}</Text>
        </Stack>
      }>
        {error && <Text c="red" size="sm" mb="md">{error}</Text>}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label={t('contacts.firstName')}
                name="first_name"
                value={form.first_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
              />
              <TextInput
                label={t('contacts.lastName')}
                name="last_name"
                value={form.last_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
              />
              <TextInput
                label={t('contacts.role')}
                value={form.role || ''}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
              <TextInput
                label={t('contacts.email')}
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextInput
                label={t('contacts.phone')}
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextInput
                label="LinkedIn"
                value={form.linkedin_url || ''}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              />
            </SimpleGrid>

            <div>
              <Autocomplete
                label={t('contacts.organization')}
                placeholder={t('contacts.searchOrg')}
                value={query}
                onChange={(val) => {
                  setQuery(val);
                  const match = organizations.find((o) => o.name === val);
                  setForm((f) => ({ ...f, organization_id: match?.id ?? null }));
                }}
                data={autocompleteData.map((d) => d.value)}
              />
              {selectedOrg && (
                <Group gap="xs" mt="xs">
                  <OrganizationTypeBadge type={selectedOrg.type} size="xs" />
                  <ProbityBadge score={selectedOrg.probity_score} level={selectedOrg.probity_level} showScore={false} />
                </Group>
              )}
              {!selectedOrg && query.trim() && autocompleteData.length === 0 && (
                <Button variant="ghost" size="small" type="button" mt="xs" onClick={() => setShowCreateOrg(true)}>
                  {t('contacts.createOrg')} "{query}"
                </Button>
              )}
            </div>

            <Checkbox
              label={t('contacts.recruiterContact')}
              checked={!!form.is_recruiter}
              onChange={(e) => setForm((f) => ({ ...f, is_recruiter: e.target.checked ? 1 : 0 }))}
            />

            <Textarea
              label={t('contacts.notes')}
              rows={4}
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />

            <Group justify="space-between">
              <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t('common.loading') : t('contacts.createContact')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {showCreateOrg && (
        <OrganizationEditModal
          initialName={query}
          onClose={() => setShowCreateOrg(false)}
          onSaved={(org) => {
            setShowCreateOrg(false);
            if (org) {
              setOrganizations((current) => [org, ...current]);
              setForm((f) => ({ ...f, organization_id: org.id }));
              setQuery(org.name);
            }
          }}
        />
      )}
    </>
  );
}

export default ContactCreateModal;
