import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Stack, Paper, SimpleGrid, Group, Text, Title, Select, Autocomplete,
  Textarea, Modal, Tabs, Center, Loader, Timeline, Anchor, ActionIcon, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil } from '@tabler/icons-react';
import { useApplicationDetail } from '../hooks/useApplicationDetail';
import { ProbityBadge } from '../components/atoms/ProbityBadge';
import { OrganizationTypeBadge } from '../components/atoms/OrganizationTypeBadge';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Button } from '../components/atoms/Button';
import { ApplicationEditModal } from '../components/organisms/ApplicationEditModal';
import { EventEditModal } from '../components/organisms/EventEditModal';
import type { Contact } from '../types';
import type { ApplicationDetailsResponse } from '../services/api';
import { STATUTS } from '../constants/statuts';
import { useI18n } from '../i18n';
import classes from './ApplicationDetails.module.css';


const EVENT_TYPE_MAP: Record<string, string> = {
  CREATED: 'application.created', UPDATED: 'application.statusUpdated', STATUS_CHANGED: 'application.statusUpdated',
  NOTE_ADDED: 'application.noteAdded', CONTACT_CREATED: 'application.contactCreated', CONTACT_LINKED: 'application.contactLinked',
  FOLLOWUP_SENT: 'application.followupSent', RESPONSE_RECEIVED: 'application.responseReceived', INTERVIEW_SCHEDULED: 'application.interviewScheduled',
  OFFER_RECEIVED: 'application.offerReceived', APPLICATION_CREATED: 'application.created', FOLLOWED_UP: 'application.followupSent',
};

function formatEventType(type: string, t: (k: string) => string) {
  const key = EVENT_TYPE_MAP[type];
  return key ? t(key) : type.replace(/_/g, ' ');
}

function renderEventPayload(event: ApplicationDetailsResponse['events'][number], t: (k: string) => string) {
  const type = event.type || event.event_type;
  switch (type) {
    case 'STATUS_CHANGED':
      return event.payload?.old_status
        ? `${t(`status.${event.payload.old_status}`) || event.payload.old_status} → ${t(`status.${event.payload.new_status}`) || event.payload.new_status}`
        : (event.payload?.new_status ? t(`status.${event.payload.new_status}`) || event.payload.new_status : null);
    case 'NOTE_ADDED': return event.payload?.text || null;
    case 'CONTACT_CREATED': return event.payload?.name ? `${t('application.contact')}: ${event.payload.name}` : null;
    case 'CONTACT_LINKED': return event.payload?.contact_name ? `${t('application.contactLinked')}: ${event.payload.contact_name}` : null;
    case 'CREATED': case 'APPLICATION_CREATED':
      return event.payload?.company ? `${event.payload.company} · ${event.payload.title}` : null;
    default: return event.payload?.text || null;
  }
}

export function ApplicationDetails() {
  const { t, locale } = useI18n();
  const STATUS_OPTIONS = useMemo(() => [
    ...STATUTS.map((s) => ({ value: s, label: t(`status.${s}`) })),
  ], [t]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = id ? parseInt(id, 10) : undefined;

  const {
    data, organizations, loading, error, refetch,
    isUpdatingStatus, updateStatus, updateApplication, addNote, markFollowup, addEvent,
    linkContact, createContact, setFinalCustomer, updateEvent, deleteEvent,
  } = useApplicationDetail(numId);

  const [newNote, setNewNote] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ApplicationDetailsResponse['events'][number] | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [finalCustomerSearch, setFinalCustomerSearch] = useState('');
  const [contactForm, setContactForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', role: '', is_recruiter: 0,
  });

  useEffect(() => { document.title = t('application.recordKicker') + ' — OfferTrail'; }, [t]);
  useEffect(() => {
    if (data) setFinalCustomerSearch(data.final_customer_organization?.name || '');
  }, [data]);

  const finalCustomerCandidates = useMemo(
    () => organizations
      .filter((o) => !['ESN', 'CABINET_RECRUTEMENT', 'PORTAGE'].includes(o.type))
      .filter((o) => o.name.toLowerCase().includes(finalCustomerSearch.toLowerCase()))
      .slice(0, 6),
    [organizations, finalCustomerSearch],
  );

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
          title={String(error) || t('application.notFound')}
          action={{ label: t('common.backToDashboard'), onClick: () => navigate('/app') }}
        />
      </Center>
    );
  }

  const { application: app, organization, final_customer_organization, events, contacts, all_contacts } = data!;

  const shouldShowFinalCustomer = organization?.type === 'ESN' || organization?.type === 'CABINET_RECRUTEMENT' || !!final_customer_organization;

  const handleUpdateStatus = async (status: string) => {
    try { await updateStatus(status); notifications.show({ message: t('application.notifUpdated'), color: 'green' }); }
    catch { notifications.show({ message: t('application.notifError'), color: 'red' }); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try { await addNote(newNote); setNewNote(''); }
    catch { notifications.show({ message: t('application.notifNoteError'), color: 'red' }); }
  };

  const handleMarkFollowup = async () => {
    try { await markFollowup(); notifications.show({ message: t('application.notifFollowupUpdated'), color: 'green' }); }
    catch { notifications.show({ message: t('application.notifFollowupError'), color: 'red' }); }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.first_name || !contactForm.last_name) return;
    try {
      await createContact({ ...contactForm, organization_id: organization?.id });
      setContactForm({ first_name: '', last_name: '', email: '', phone: '', role: '', is_recruiter: 0 });
      setShowContactModal(false);
    } catch { notifications.show({ message: t('contacts.createError'), color: 'red' }); }
  };

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Link to="/app/candidatures" className={classes.back}>← {t('application.backToApps')}</Link>

      {/* Hero */}
      <Paper className={classes.hero} p="xl" radius="lg" withBorder>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className={classes.heroGrid}>
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.recordKicker')}</Text>
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
                disabled={isUpdatingStatus}
                rightSection={isUpdatingStatus ? <Loader size={12} /> : undefined}
              />
              <Button variant="ghost" size="small" onClick={() => addEvent('RESPONSE_RECEIVED')}>{t('application.responseAction')}</Button>
              <Button variant="primary" size="small" onClick={handleMarkFollowup}>{t('application.followupAction')}</Button>
              <Button variant="ghost" size="small" onClick={() => setShowEditModal(true)}>{t('application.edit')}</Button>
            </Group>
          </Stack>

          <Stack gap="md">
            <Paper p="sm" radius="md" withBorder>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">{t('application.appliedOn')}</Text>
              <Text size="xl" fw={700}>{app.applied_at || '-'}</Text>
              <Text size="xs" c="dimmed">{t('application.source')}: {app.source || t('dashboard.sourceDirect')}</Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">{t('application.followup')}</Text>
              <Text size="xl" fw={700}>{app.next_followup_at || '-'}</Text>
            </Paper>
            {organization && (
              <Text size="sm">
                <Text span c="dimmed">{t('application.organization')}: </Text>
                <Anchor component={Link} to={`/organizations/${organization.id}`}>{organization.name}</Anchor>
              </Text>
            )}
            {shouldShowFinalCustomer && (
              <Text size="sm">
                <Text span c="dimmed">{t('newApplication.finalCustomer')}: </Text>
                {final_customer_organization
                  ? <Anchor component={Link} to={`/organizations/${final_customer_organization.id}`}>{final_customer_organization.name}</Anchor>
                  : t('application.nonLinked')}
              </Text>
            )}
          </Stack>
        </SimpleGrid>
      </Paper>

      {/* Main layout */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className={classes.contentGrid}>
        {/* Timeline + notes */}
        <Paper p="lg" radius="lg" withBorder>
          <Title order={3} mb="md">{t('application.timeline')}</Title>
          {events.length > 0 ? (
            <Timeline active={events.length - 1} bulletSize={12} lineWidth={2}>
              {events.map((event: ApplicationDetailsResponse['events'][number], index: number) => (
                <Timeline.Item
                  key={`${event.id || index}-${event.ts}`}
                  title={
                    <Group gap={4} align="center">
                      <Text size="sm" fw={500}>{formatEventType(event.type || event.event_type, t)}</Text>
                      {event.id && (
                        <Tooltip label={t('application.editEvent')} withArrow>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="dimmed"
                            onClick={() => setEditingEvent(event)}
                            aria-label={t('application.editEvent')}
                          >
                            <IconPencil size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  }
                >
                  <Text size="xs" c="dimmed">{new Date(event.ts).toLocaleString(locale.startsWith('fr') ? 'fr-FR' : 'en-US')}</Text>
                  {renderEventPayload(event, t) && (
                    <Text size="xs" c="dimmed" mt={2}>{renderEventPayload(event, t)}</Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">{t('application.noEvents')}</Text>
          )}

          <form onSubmit={handleAddNote} className={classes.noteForm}>
            <Stack gap="sm">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.quickNote')}</Text>
              <Textarea
                placeholder={t('application.addNote')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                minRows={3}
              />
              <Button type="submit" variant="primary">{t('common.create')}</Button>
            </Stack>
          </form>
        </Paper>

        {/* Details + contacts */}
        <Stack gap="md">
          <Paper p="lg" radius="lg" withBorder>
            <Title order={3} mb="md">{t('application.details')}</Title>
            <SimpleGrid cols={2} spacing="sm">
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('dashboard.status')}</Text>
                <StatusBadge status={app.status} />
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.type')}</Text>
                <Text size="sm" c="dimmed">{t(`newApplication.jobTypes.${app.type}`) || app.type}</Text>
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.source')}</Text>
                <Text size="sm" c="dimmed">{app.source || t('dashboard.sourceDirect')}</Text>
              </div>
              <div>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('application.appliedAt')}</Text>
                <Text size="sm" c="dimmed">{app.applied_at || '-'}</Text>
              </div>
            </SimpleGrid>

            {shouldShowFinalCustomer && (
              <Stack gap="xs" mt="md">
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{t('newApplication.finalCustomer')}</Text>
                <Autocomplete
                  placeholder={t('newApplication.finalCustomerPlaceholder')}
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
                    {t('organization.maintenance.resetAction')}
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
              <Title order={3}>{t('application.contacts')}</Title>
              <Button variant="ghost" size="small" onClick={() => setShowContactModal(true)}>+ {t('application.addContact')}</Button>
            </Group>
            {contacts.length > 0 ? (
              <Stack gap="sm">
                {contacts.map((c: Contact) => (
                  <Paper key={c.id} p="sm" radius="md" withBorder>
                    <Text size="sm" fw={700}>{c.first_name} {c.last_name}</Text>
                    <Group gap="xs">
                      {c.is_recruiter === 1 && <Text size="xs" c="dimmed">{t('application.recruiter')}</Text>}
                      <Text size="xs" c="dimmed">{c.role || t('application.contact')}</Text>
                    </Group>
                    {(c.email || c.phone) && (
                      <Text size="xs" c="dimmed" mt={2}>{[c.email, c.phone].filter(Boolean).join(' · ')}</Text>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">{t('application.noContacts')}</Text>
            )}
          </Paper>
        </Stack>
      </SimpleGrid>

      {/* Contact modal */}
      <Modal opened={showContactModal} onClose={() => setShowContactModal(false)} title={t('application.addContactTitle')}>
        <Tabs defaultValue="create">
          <Tabs.List mb="md">
            <Tabs.Tab value="create">{t('application.createNew')}</Tabs.Tab>
            <Tabs.Tab value="link" onClick={() => setIsLinking(true)}>{t('application.linkExisting')}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="create">
            <form onSubmit={handleCreateContact}>
              <Stack gap="sm">
                <SimpleGrid cols={2} spacing="sm">
                  <input className="mantine-Input-input" placeholder={t('contacts.firstName')} required value={contactForm.first_name} onChange={(e) => setContactForm((f) => ({ ...f, first_name: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder={t('contacts.lastName')} required value={contactForm.last_name} onChange={(e) => setContactForm((f) => ({ ...f, last_name: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder={t('contacts.email')} type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder={t('contacts.phone')} value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} />
                  <input className="mantine-Input-input" placeholder={t('contacts.role')} value={contactForm.role} onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))} />
                  <label className={classes.checkboxLabel}>
                    <input type="checkbox" checked={contactForm.is_recruiter === 1} onChange={(e) => setContactForm((f) => ({ ...f, is_recruiter: e.target.checked ? 1 : 0 }))} />
                    {t('contacts.recruiterContact')}
                  </label>
                </SimpleGrid>
                <Button type="submit" variant="primary">{t('application.createAndLink')}</Button>
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
                      <Text size="xs" c="dimmed">{c.role || t('application.contact')}</Text>
                    </div>
                    <Button variant="ghost" size="small" onClick={() => { linkContact(c.id); setShowContactModal(false); }}>
                      {t('application.linkExisting')}
                    </Button>
                  </Group>
                ))}
              {(!all_contacts || all_contacts.length === 0) && (
                <Text size="sm" c="dimmed" fs="italic">{t('application.noExistingContacts')}</Text>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {showEditModal && (
        <ApplicationEditModal
          application={app}
          onClose={() => setShowEditModal(false)}
          onSaved={async (payload) => {
            await updateApplication(payload);
            notifications.show({ message: 'Candidature mise à jour', color: 'green' });
          }}
        />
      )}

      {editingEvent && (
        <EventEditModal
          event={editingEvent as { id: string; type: string; ts: string; payload?: { text?: string | null; old_status?: string | null; new_status?: string | null } }}
          onClose={() => setEditingEvent(null)}
          onSaved={async (eventId, data) => {
            await updateEvent({ eventId, data });
            notifications.show({ message: 'Événement mis à jour', color: 'green' });
          }}
          onDeleted={async (eventId) => {
            await deleteEvent(eventId);
            notifications.show({ message: 'Événement supprimé', color: 'green' });
          }}
        />
      )}
    </Stack>
  );
}
