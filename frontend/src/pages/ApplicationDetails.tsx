import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Stack, Paper, SimpleGrid, Group, Text, Title, Select, Autocomplete,
  Textarea, Modal, Tabs, Center, Loader, Timeline, Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useApplicationDetail } from '../hooks/useApplicationDetail';
import { ProbityBadge } from '../components/atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../components/atoms/OrganizationTypeBadge';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Button } from '../components/atoms/Button';
import type { Contact } from '../types';
import type { ApplicationDetailsResponse } from '../services/api';
import { statusLabelMap } from '../utils/statut';
import classes from './ApplicationDetails.module.css';

const STATUS_OPTIONS = Object.entries(statusLabelMap).map(([value, label]) => ({ value, label }));

const EVENT_TYPE_MAP: Record<string, string> = {
  CREATED: 'Création', UPDATED: 'Mise à jour', STATUS_CHANGED: 'Statut',
  NOTE_ADDED: 'Note', CONTACT_CREATED: 'Contact créé', CONTACT_LINKED: 'Contact lié',
  FOLLOWUP_SENT: 'Relance', RESPONSE_RECEIVED: 'Réponse', INTERVIEW_SCHEDULED: 'Entretien',
  OFFER_RECEIVED: 'Offre', APPLICATION_CREATED: 'Création', FOLLOWED_UP: 'Relance',
};

function formatEventType(type: string) {
  return EVENT_TYPE_MAP[type] || type.replace(/_/g, ' ');
}

function renderEventPayload(event: ApplicationDetailsResponse['events'][number]) {
  const type = event.type || event.event_type;
  switch (type) {
    case 'STATUS_CHANGED':
      return event.payload?.old_status
        ? `${statusLabelMap[event.payload.old_status] || event.payload.old_status} → ${statusLabelMap[event.payload.new_status] || event.payload.new_status}`
        : (event.payload?.new_status ? statusLabelMap[event.payload.new_status] || event.payload.new_status : null);
    case 'NOTE_ADDED': return event.payload?.text || null;
    case 'CONTACT_CREATED': return event.payload?.name ? `Contact: ${event.payload.name}` : null;
    case 'CONTACT_LINKED': return event.payload?.contact_name ? `Contact lié: ${event.payload.contact_name}` : null;
    case 'CREATED': case 'APPLICATION_CREATED':
      return event.payload?.company ? `${event.payload.company} · ${event.payload.title}` : null;
    default: return event.payload?.text || null;
  }
}

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = id ? parseInt(id, 10) : undefined;

  const {
    data, organizations, loading, error, refetch,
    updateStatus, addNote, markFollowup, addEvent,
    linkContact, createContact, setFinalCustomer,
  } = useApplicationDetail(numId);

  const [newNote, setNewNote] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [finalCustomerSearch, setFinalCustomerSearch] = useState('');
  const [contactForm, setContactForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', role: '', is_recruiter: 0,
  });

  useEffect(() => { document.title = 'Candidature — OfferTrail'; }, []);
  useEffect(() => {
    if (data) setFinalCustomerSearch(data.final_customer_organization?.name || '');
  }, [data]);

  if (error && (error as { response?: { status?: number } }).response?.status === 401) {
    navigate('/login');
    return null;
  }

  if (loading && !data) {
    return <Center h={300}><Loader /></Center>;
  }

  if (!data && !loading) {
    return (
      <Center h={300}>
        <EmptyState
          title={String(error) || 'Candidature introuvable.'}
          action={{ label: 'Retour', onClick: () => navigate('/app') }}
        />
      </Center>
    );
  }

  const { application: app, organization, final_customer_organization, events, contacts, all_contacts } = data!;

  const finalCustomerCandidates = useMemo(
    () => organizations
      .filter((o) => !['ESN', 'CABINET_RECRUTEMENT', 'PORTAGE'].includes(o.type))
      .filter((o) => o.name.toLowerCase().includes(finalCustomerSearch.toLowerCase()))
      .slice(0, 6),
    [organizations, finalCustomerSearch],
  );

  const shouldShowFinalCustomer = organization?.type === 'ESN' || organization?.type === 'CABINET_RECRUTEMENT' || !!final_customer_organization;

  const handleUpdateStatus = async (status: string) => {
    try { await updateStatus(status); notifications.show({ message: 'Statut mis à jour', color: 'green' }); }
    catch { notifications.show({ message: 'Impossible de mettre à jour le statut.', color: 'red' }); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try { await addNote(newNote); setNewNote(''); }
    catch { notifications.show({ message: "Impossible d'ajouter la note.", color: 'red' }); }
  };

  const handleMarkFollowup = async () => {
    try { await markFollowup(); notifications.show({ message: 'Relance mise à jour', color: 'green' }); }
    catch { notifications.show({ message: 'Impossible de mettre à jour la relance.', color: 'red' }); }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.first_name || !contactForm.last_name) return;
    try {
      await createContact({ ...contactForm, organization_id: organization?.id });
      setContactForm({ first_name: '', last_name: '', email: '', phone: '', role: '', is_recruiter: 0 });
      setShowContactModal(false);
    } catch { notifications.show({ message: 'Impossible de créer le contact.', color: 'red' }); }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Link to="/" className={classes.back}>← Retour au tableau de bord</Link>

      {/* Hero */}
      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className={classes.heroGrid}>
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Application record</Text>
            <Title order={1}>{app.company}</Title>
            <Text size="lg" c="dimmed">{app.title}</Text>
            <Group mt="xs" gap="xs">
              <StatusBadge status={app.status} />
              {organization && <OrganizationTypeBadge type={organization.type} />}
              {organization && <ProbityBadge score={organization.probity_score} level={organization.probity_level} />}
            </Group>
            <Group mt="sm" gap="sm">
              <Select
                data={STATUS_OPTIONS}
                value={app.status}
                onChange={(v) => v && handleUpdateStatus(v)}
                size="xs"
                className={classes.statusSelect}
              />
              <Button variant="ghost" size="small" onClick={() => addEvent('RESPONSE_RECEIVED')}>Réponse reçue</Button>
              <Button variant="primary" size="small" onClick={handleMarkFollowup}>Relance faite</Button>
            </Group>
          </Stack>

          <Stack gap="md">
            <Paper p="sm" radius="md" withBorder>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">Candidaté le</Text>
              <Text size="xl" fw={700}>{app.applied_at || '-'}</Text>
              <Text size="xs" c="dimmed">source: {app.source || 'Direct'}</Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">Follow-up</Text>
              <Text size="xl" fw={700}>{app.next_followup_at || '-'}</Text>
            </Paper>
            {organization && (
              <Text size="sm">
                <Text span c="dimmed">Organisation: </Text>
                <Anchor component={Link} to={`/organizations/${organization.id}`}>{organization.name}</Anchor>
              </Text>
            )}
            {shouldShowFinalCustomer && (
              <Text size="sm">
                <Text span c="dimmed">Client final: </Text>
                {final_customer_organization
                  ? <Anchor component={Link} to={`/organizations/${final_customer_organization.id}`}>{final_customer_organization.name}</Anchor>
                  : 'Non lié'}
              </Text>
            )}
          </Stack>
        </SimpleGrid>
      </Paper>

      {/* Main layout */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className={classes.contentGrid}>
        {/* Timeline + notes */}
        <Paper p="lg" radius="lg" withBorder>
          <Title order={3} mb="md">Timeline</Title>
          {events.length > 0 ? (
            <Timeline active={events.length - 1} bulletSize={12} lineWidth={2}>
              {events.map((event: ApplicationDetailsResponse['events'][number], index: number) => (
                <Timeline.Item key={`${event.id || index}-${event.ts}`} title={formatEventType(event.type || event.event_type)}>
                  <Text size="xs" c="dimmed">{new Date(event.ts).toLocaleString()}</Text>
                  {renderEventPayload(event) && (
                    <Text size="xs" c="dimmed" mt={2}>{renderEventPayload(event)}</Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">Aucun événement enregistré.</Text>
          )}

          <form onSubmit={handleAddNote} className={classes.noteForm}>
            <Stack gap="sm">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Note rapide</Text>
              <Textarea
                placeholder="Saisir une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                minRows={3}
              />
              <Button type="submit" variant="primary">Ajouter</Button>
            </Stack>
          </form>
        </Paper>

        {/* Details + contacts */}
        <Stack gap="md">
          <Paper p="lg" radius="lg" withBorder>
            <Title order={3} mb="md">Détails</Title>
            <SimpleGrid cols={2} spacing="sm">
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Statut</Text>
                <StatusBadge status={app.status} />
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Type</Text>
                <Text size="sm" c="dimmed">{app.type}</Text>
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Source</Text>
                <Text size="sm" c="dimmed">{app.source || 'Direct'}</Text>
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Applied at</Text>
                <Text size="sm" c="dimmed">{app.applied_at || '-'}</Text>
              </div>
            </SimpleGrid>

            {shouldShowFinalCustomer && (
              <Stack gap="xs" mt="md">
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Lier un client final</Text>
                <Autocomplete
                  placeholder="Rechercher un client final"
                  value={finalCustomerSearch}
                  onChange={setFinalCustomerSearch}
                  data={finalCustomerCandidates.map((c) => c.name)}
                  onOptionSubmit={(val) => {
                    const found = finalCustomerCandidates.find((c) => c.name === val);
                    if (found) setFinalCustomer(found.id);
                  }}
                />
                {final_customer_organization && (
                  <Button variant="ghost" size="small" onClick={() => setFinalCustomer(null)}>
                    Retirer le client final
                  </Button>
                )}
              </Stack>
            )}

            {app.job_url && (
              <Anchor href={app.job_url} target="_blank" mt="md" display="block" size="sm">
                Voir l'offre d'emploi →
              </Anchor>
            )}
          </Paper>

          <Paper p="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Contacts</Title>
              <Button variant="ghost" size="small" onClick={() => setShowContactModal(true)}>+ Ajouter</Button>
            </Group>
            {contacts.length > 0 ? (
              <Stack gap="sm">
                {contacts.map((c: Contact) => (
                  <Paper key={c.id} p="sm" radius="md" withBorder>
                    <Text size="sm" fw={700}>{c.first_name} {c.last_name}</Text>
                    <Group gap="xs">
                      {c.is_recruiter === 1 && <Text size="xs" c="dimmed">Recruteur</Text>}
                      <Text size="xs" c="dimmed">{c.role || 'Contact'}</Text>
                    </Group>
                    {(c.email || c.phone) && (
                      <Text size="xs" c="dimmed" mt={2}>{[c.email, c.phone].filter(Boolean).join(' · ')}</Text>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">Aucun contact lié pour l'instant.</Text>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Contact modal */}
      <Modal opened={showContactModal} onClose={() => setShowContactModal(false)} title="Ajouter un contact">
        <Tabs defaultValue="create">
          <Tabs.List mb="md">
            <Tabs.Tab value="create">Créer</Tabs.Tab>
            <Tabs.Tab value="link" onClick={() => setIsLinking(true)}>Lier existant</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="create">
            <form onSubmit={handleCreateContact}>
              <Stack gap="sm">
                <SimpleGrid cols={2} spacing="sm">
                  <input className="mantine-Input-input" placeholder="Prénom" required value={contactForm.first_name} onChange={(e) => setContactForm((f) => ({ ...f, first_name: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder="Nom" required value={contactForm.last_name} onChange={(e) => setContactForm((f) => ({ ...f, last_name: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder="Téléphone" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder="Rôle" value={contactForm.role} onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))} />
                  <label className={classes.checkboxLabel}>
                    <input type="checkbox" checked={contactForm.is_recruiter === 1} onChange={(e) => setContactForm((f) => ({ ...f, is_recruiter: e.target.checked ? 1 : 0 }))} />
                    Est recruteur
                  </label>
                </SimpleGrid>
                <Button type="submit" variant="primary">Créer et lier</Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="link">
            <Stack gap="sm" className={classes.linkList}>
              {all_contacts
                ?.filter((c: Contact) => !contacts.some((r: Contact) => r.id === c.id))
                .map((c: Contact) => (
                  <Group
                    key={c.id}
                    justify="space-between"
                    p="sm"
                    className={classes.linkItem}
                  >
                    <div>
                      <Text size="sm" fw={700}>{c.first_name} {c.last_name}</Text>
                      <Text size="xs" c="dimmed">{c.role || 'Contact'}</Text>
                    </div>
                    <Button variant="ghost" size="small" onClick={() => { linkContact(c.id); setShowContactModal(false); }}>
                      Lier
                    </Button>
                  </Group>
                ))}
              {(!all_contacts || all_contacts.length === 0) && (
                <Text size="sm" c="dimmed" fs="italic">Aucun contact existant.</Text>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </Stack>
  );
}
