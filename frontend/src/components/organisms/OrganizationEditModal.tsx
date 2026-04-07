import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Modal, TextInput, Textarea, Select, SimpleGrid, Stack, Group, Text,
  Autocomplete, Badge, Paper, Center, Loader,
} from '@mantine/core';
import type { Contact, Organization, OrganizationType } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { Button } from '../atoms/Button';

interface OrganizationEditModalProps {
  organization?: Organization | null;
  initialName?: string;
  initialType?: OrganizationType;
  onClose: () => void;
  onSaved: (org?: Organization) => void;
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

const EMPTY_CONTACT = { first_name: '', last_name: '', role: '', email: '', phone: '', linkedin_url: '', notes: '' };

export function OrganizationEditModal({
  organization,
  initialName,
  initialType = 'AUTRE',
  onClose,
  onSaved,
}: OrganizationEditModalProps) {
  const isCreate = !organization;

  const [form, setForm] = useState<Partial<Organization>>({
    name: initialName || organization?.name || '',
    type: initialType || organization?.type || 'AUTRE',
    city: organization?.city || '',
    website: organization?.website || '',
    linkedin_url: organization?.linkedin_url || '',
    notes: organization?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState('');
  const [linkingContactId, setLinkingContactId] = useState<number | null>(null);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContact, setNewContact] = useState(EMPTY_CONTACT);

  useEffect(() => {
    setForm({
      name: initialName || organization?.name || '',
      type: initialType || organization?.type || 'AUTRE',
      city: organization?.city || '',
      website: organization?.website || '',
      linkedin_url: organization?.linkedin_url || '',
      notes: organization?.notes || '',
    });
  }, [organization, initialName, initialType]);

  const loadContacts = async () => {
    if (!organization) return;
    setContactsLoading(true);
    setContactError(null);
    try {
      const [current, all] = await Promise.all([
        contactService.getAll({ organization_id: organization.id }),
        contactService.getAll(),
      ]);
      setLinkedContacts(current);
      setAvailableContacts(all.filter((c) => !current.some((x) => x.id === c.id)));
    } catch (e: unknown) {
      setContactError((axios.isAxiosError(e) && e.response?.data?.detail) || 'Impossible de charger les contacts.');
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => { loadContacts(); }, [organization?.id]);

  const filteredContacts = useMemo(() => {
    const needle = contactQuery.trim().toLowerCase();
    if (!needle) return availableContacts.slice(0, 6);
    return availableContacts
      .filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(needle) || (c.email || '').toLowerCase().includes(needle))
      .slice(0, 6);
  }, [availableContacts, contactQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isCreate) {
        const created = await organizationService.create({
          name: form.name, type: form.type,
          city: form.city || null, website: form.website || null,
          linkedin_url: form.linkedin_url || null, notes: form.notes || null,
        });
        const full = await organizationService.getById(created.id);
        onSaved(full);
      } else if (organization) {
        await organizationService.update(organization.id, form);
        onSaved();
      }
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) && err.response?.data?.detail) || "Échec de la sauvegarde de l'ETS.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkContact = async (contact: Contact) => {
    if (!organization) return;
    setLinkingContactId(contact.id);
    try {
      await contactService.update(contact.id, { organization_id: organization.id });
      setContactQuery('');
      await loadContacts();
      onSaved();
    } catch (e: unknown) {
      setContactError((axios.isAxiosError(e) && e.response?.data?.detail) || 'Impossible de rattacher ce contact.');
    } finally {
      setLinkingContactId(null);
    }
  };

  const handleCreateContact = async () => {
    if (!organization) return;
    setCreatingContact(true);
    try {
      await contactService.create({ ...newContact, organization_id: organization.id });
      setNewContact(EMPTY_CONTACT);
      await loadContacts();
      onSaved();
    } catch (e: unknown) {
      setContactError((axios.isAxiosError(e) && e.response?.data?.detail) || 'Impossible de créer le contact.');
    } finally {
      setCreatingContact(false);
    }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="xl"
      title={
        <Stack gap={2}>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">
            {isCreate ? 'Création ETS' : 'Édition ETS'}
          </Text>
          <Text size="xl" fw={700}>
            {isCreate ? 'Créer un établissement' : "Modifier l'ETS"}
          </Text>
        </Stack>
      }
    >
      {error && <Text c="red" size="sm" mb="md">{error}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Nom"
              required
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ gridColumn: '1 / -1' }}
            />
            <Select
              label="Type"
              data={ORG_TYPE_OPTIONS}
              value={(form.type as string) || 'AUTRE'}
              onChange={(val) => setForm((f) => ({ ...f, type: (val as OrganizationType) || 'AUTRE' }))}
            />
            <TextInput
              label="Ville"
              value={(form.city as string) || ''}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <TextInput
              label="Site web"
              value={(form.website as string) || ''}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
            <TextInput
              label="LinkedIn"
              value={(form.linkedin_url as string) || ''}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
            />
            <Textarea
              label="Notes"
              rows={4}
              value={(form.notes as string) || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              style={{ gridColumn: '1 / -1' }}
            />
          </SimpleGrid>

          {!isCreate && organization && (
            <Stack gap="md">
              <Text size="sm" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Contacts liés</Text>

              {contactError && <Text c="red" size="sm">{contactError}</Text>}

              {contactsLoading ? (
                <Center h={60}><Loader size="sm" /></Center>
              ) : linkedContacts.length > 0 ? (
                <Stack gap="xs">
                  {linkedContacts.map((c) => (
                    <Paper key={c.id} p="sm" withBorder radius="md">
                      <Text size="sm" fw={700}>{c.first_name} {c.last_name}</Text>
                      <Group gap="xs" mt={4}>
                        {c.role && <Badge variant="light" size="xs">{c.role}</Badge>}
                        {c.email && <Badge variant="light" size="xs">{c.email}</Badge>}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">Aucun contact rattaché à cet ETS.</Text>
              )}

              <div>
                <Autocomplete
                  label="Lier un contact existant"
                  placeholder="Rechercher un nom ou un email…"
                  value={contactQuery}
                  onChange={setContactQuery}
                  data={filteredContacts.map((c) => `${c.first_name} ${c.last_name}`)}
                  onOptionSubmit={(val) => {
                    const found = filteredContacts.find((c) => `${c.first_name} ${c.last_name}` === val);
                    if (found) handleLinkContact(found);
                  }}
                />
                {linkingContactId !== null && <Text size="xs" c="dimmed" mt="xs">Ajout en cours…</Text>}
              </div>

              <Stack gap="xs">
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Créer un nouveau contact</Text>
                <SimpleGrid cols={2} spacing="sm">
                  <TextInput placeholder="Prénom" value={newContact.first_name} onChange={(e) => setNewContact((n) => ({ ...n, first_name: e.target.value }))} />
                  <TextInput placeholder="Nom" value={newContact.last_name} onChange={(e) => setNewContact((n) => ({ ...n, last_name: e.target.value }))} />
                  <TextInput placeholder="Rôle" value={newContact.role} onChange={(e) => setNewContact((n) => ({ ...n, role: e.target.value }))} />
                  <TextInput placeholder="Email" type="email" value={newContact.email} onChange={(e) => setNewContact((n) => ({ ...n, email: e.target.value }))} />
                  <TextInput placeholder="Téléphone" value={newContact.phone} onChange={(e) => setNewContact((n) => ({ ...n, phone: e.target.value }))} />
                  <TextInput placeholder="LinkedIn" value={newContact.linkedin_url} onChange={(e) => setNewContact((n) => ({ ...n, linkedin_url: e.target.value }))} />
                  <Textarea placeholder="Notes" rows={2} value={newContact.notes} onChange={(e) => setNewContact((n) => ({ ...n, notes: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                </SimpleGrid>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={creatingContact || !newContact.first_name.trim() || !newContact.last_name.trim()}
                  onClick={handleCreateContact}
                >
                  {creatingContact ? 'Création…' : 'Créer et rattacher'}
                </Button>
              </Stack>
            </Stack>
          )}

          <Group justify="space-between">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Sauvegarde…' : isCreate ? "Créer l'ETS" : 'Enregistrer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export default OrganizationEditModal;
