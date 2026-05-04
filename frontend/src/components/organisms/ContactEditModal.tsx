import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, Checkbox, SimpleGrid, Stack, Group, Text, Autocomplete,
} from '@mantine/core';
import type { Contact, Organization } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { useI18n } from '../../i18n';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { Button } from '../atoms/Button';

interface ContactEditModalProps {
  contact: Contact;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactEditModal({ contact, onClose, onSaved }: ContactEditModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Contact>>({ ...contact });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return organizations.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 6);
  }, [organizations, query]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await contactService.update(contact.id, form);
      onSaved();
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || t('contacts.editError'));
    } finally {
      setLoading(false);
    }
  };

  const linkedOrg = organizations.find((o) => o.id === form.organization_id);

  return (
    <>
      <Modal opened onClose={onClose} size="lg" title={t('contacts.editTitle')}>
        {error && <Text c="red" size="sm" mb="md">{error}</Text>}

        <form onSubmit={handleSave}>
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label={t('contacts.firstName')}
                value={form.first_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
              <TextInput
                label={t('contacts.lastName')}
                value={form.last_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
              <TextInput
                label={t('contacts.role')}
                value={form.role || ''}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
              <TextInput
                label={t('contacts.email')}
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextInput
                label={t('contacts.phone')}
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextInput
                label={t('contacts.linkedin')}
                value={form.linkedin_url || ''}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              />
            </SimpleGrid>

            <Textarea
              label={t('contacts.notes')}
              rows={3}
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />

            <Checkbox
              label={t('contacts.recruiter')}
              checked={!!form.is_recruiter}
              onChange={(e) => setForm((f) => ({ ...f, is_recruiter: e.target.checked ? 1 : 0 }))}
            />

            <div>
              <Autocomplete
                label={t('contacts.organization')}
                placeholder={t('contacts.searchOrg')}
                value={query}
                onChange={(val) => {
                  setQuery(val);
                  const match = organizations.find((o) => o.name === val);
                  if (match) setForm((f) => ({ ...f, organization_id: match.id }));
                }}
                data={filtered.map((o) => o.name)}
              />
              {linkedOrg && (
                <Group gap="xs" mt="xs">
                  <OrganizationTypeBadge type={linkedOrg.type} size="xs" />
                  <Text size="xs">{linkedOrg.name}</Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => { setForm((f) => ({ ...f, organization_id: null })); setQuery(''); }}
                  >
                    {t('contacts.removeOrg')}
                  </Button>
                </Group>
              )}
              {!linkedOrg && query.trim() && filtered.length === 0 && (
                <Button variant="ghost" size="small" type="button" mt="xs" onClick={() => setShowCreateOrg(true)}>
                  {t('contacts.createOrgAction')}
                </Button>
              )}
            </div>

            <Group justify="space-between">
              <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t('account.saving') : t('common.save')}
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

export default ContactEditModal;
