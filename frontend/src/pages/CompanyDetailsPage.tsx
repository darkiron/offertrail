import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Anchor, Badge, Chip, Group, Paper, SimpleGrid, Stack, Text, Title,
} from '@mantine/core';
import { api } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import StatusBadge from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import OrganizationEditModal from '../components/organisms/OrganizationEditModal';
import ContactEditModal from '../components/organisms/ContactEditModal';
import type { Application, Contact, Organization } from '../types';
import classes from './CompanyDetailsPage.module.css';

type CompanyDetails = Organization & {
  applications: Application[];
  contacts: Contact[];
  events: Array<{
    id: number;
    ts: string;
    type: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    application?: { id: number; title: string; status: string };
    contact?: { id: number; name: string };
  }>;
};

type DetailTab = 'overview' | 'applications' | 'contacts' | 'activity';

const tabDefinitions: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'activity', label: 'Activité' },
];

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('fr-FR', withTime ? {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  } : {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatEventLabel = (rawType?: string) => {
  const type = String(rawType || '').toUpperCase();
  const map: Record<string, string> = {
    UPDATED: 'Organisation mise a jour',
    CREATED: 'Creation',
    STATUS_CHANGED: 'Statut modifie',
    NOTE_ADDED: 'Note ajoutee',
    CONTACT_LINKED: 'Contact lie',
    CONTACT_CREATED: 'Contact cree',
    RESPONSE_RECEIVED: 'Reponse recue',
    FOLLOWUP_SENT: 'Relance envoyee',
    OFFER_RECEIVED: 'Offre recue',
    INTERVIEW_SCHEDULED: 'Entretien planifie',
  };
  return map[type] || type.replace(/_/g, ' ') || 'Evenement';
};

const getProbityHint = (level: Organization['probity_level'], score: number | null) => {
  switch (level) {
    case 'fiable': return score !== null ? 'Signal favorable et documente.' : 'Signal favorable.';
    case 'moyen': return 'Signal mitige a surveiller.';
    case 'méfiance': return 'Signal de risque eleve.';
    case 'insuffisant': return 'Manque de donnees: a traiter comme signal faible.';
    default: return 'Signal faible.';
  }
};

export const CompanyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchCompany = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCompany(Number(id));
      setData(response);
    } catch {
      setError('Impossible de charger la fiche ETS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = 'Entreprise — OfferTrail'; }, []);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  if (loading && !data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder><Spinner /></Paper>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Stack gap="lg" p="lg" className={classes.shell}>
        <Paper p="xl" radius="lg" withBorder>
          <Text c="dimmed" ta="center">{error || 'ETS introuvable.'}</Text>
          <Group justify="center" mt="md">
            <Anchor component={Link} to="/app/etablissements">Retour aux établissements</Anchor>
          </Group>
        </Paper>
      </Stack>
    );
  }

  const responseRate = data.response_rate ?? 0;
  const positiveRate = data.positive_rate ?? 0;
  const rejectionRate = Math.max(0, Math.min(100, Math.round(responseRate - positiveRate)));
  const dueFollowups = data.applications.filter(
    (app) => Boolean(app.next_followup_at) && app.status !== 'REJECTED' && app.status !== 'OFFER',
  ).length;

  return (
    <Stack gap="lg" p="lg" className={classes.shell}>
      <Anchor component={Link} to="/organizations" c="dimmed" size="sm">← Retour aux établissements</Anchor>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'stretch' }}>
        <Paper className={classes.hero} p="xl" radius="lg" withBorder>
          <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Fiche detail ETS</Text>
          <Title order={1} mt="xs">{data.name}</Title>
          <Group mt="md" gap="xs" wrap="wrap">
            <OrganizationTypeBadge type={data.type} />
            <ProbityBadge score={data.probity_score} level={data.probity_level} />
            {data.city ? <Badge variant="outline" size="sm">{data.city}</Badge> : null}
          </Group>
          <Text c="dimmed" mt="md" size="sm">
            Vérifie les informations de l&apos;organisation, consulte les candidatures liées, ouvre les contacts utiles et
            mets à jour la fiche ETS sans quitter la page.
          </Text>
          <Group mt="lg" gap="xs" wrap="wrap">
            <Button variant="primary" onClick={() => setEditingOrganization(true)}>Modifier la fiche ETS</Button>
            <Button component={Link} to={`/app/etablissements/maintenance?source=${data.id}`} variant="ghost">Maintenance ETS</Button>
            {data.website ? (
              <a href={data.website} target="_blank" rel="noreferrer">
                <Button variant="ghost">Site web</Button>
              </a>
            ) : null}
            {data.linkedin_url ? (
              <a href={data.linkedin_url} target="_blank" rel="noreferrer">
                <Button variant="ghost">LinkedIn</Button>
              </a>
            ) : null}
          </Group>
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Synthèse rapide</Text>
              <Stack gap="xs">
                {[
                  { label: 'Dernière mise à jour', value: formatDate(data.updated_at, true) },
                  { label: 'Création de la fiche', value: formatDate(data.created_at) },
                  { label: 'Contacts liés', value: String(data.contacts.length) },
                ].map((item) => (
                  <Group key={item.label} justify="space-between">
                    <Text size="xs" c="dimmed">{item.label}</Text>
                    <Text size="xs" fw={600}>{item.value}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Cadence</Text>
              <Text size="sm" c="dimmed">
                {dueFollowups > 0 ? `${dueFollowups} relance(s) à surveiller` : 'Aucune relance en attente'}
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {[
          { label: 'Candidatures', value: data.total_applications, hint: 'volume cumulé' },
          { label: 'Taux de réponse', value: `${responseRate}%`, hint: 'retours détectés' },
          { label: 'Taux positif', value: `${positiveRate}%`, hint: 'entretiens ou offres' },
          { label: 'Ghosting', value: data.ghosting_count, hint: 'sans retour après 30j' },
        ].map((stat) => (
          <Paper key={stat.label} p="lg" radius="lg" withBorder>
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{stat.label}</Text>
            <Text size="xl" fw={700} mt="xs" className={classes.statsValue}>{stat.value}</Text>
            <Text size="xs" c="dimmed" mt={4}>{stat.hint}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Paper p="xl" radius="lg" withBorder>
          <Group gap="xs" mb="lg" wrap="wrap">
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

          {activeTab === 'overview' ? (
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                {[
                  { label: 'Temps moyen de réponse', value: data.avg_response_days ?? '-', hint: 'jours avant premier retour' },
                  { label: 'Taux de rejet estimé', value: `${rejectionRate}%`, hint: 'depuis les signaux de statut' },
                  { label: 'Réponses constatées', value: data.total_responses, hint: 'sur l\'ensemble des candidatures' },
                  { label: 'Signal probité', value: null, hint: getProbityHint(data.probity_level, data.probity_score), probity: true },
                ].map((metric) => (
                  <Paper key={metric.label} p="md" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{metric.label}</Text>
                    {metric.probity ? (
                      <div className={classes.probitySlot}>
                        <ProbityBadge score={data.probity_score} level={data.probity_level} size="md" />
                      </div>
                    ) : (
                      <Text size="xl" fw={700} mt={6}>{metric.value}</Text>
                    )}
                    <Text size="xs" c="dimmed" mt={4}>{metric.hint}</Text>
                  </Paper>
                ))}
              </SimpleGrid>

              <Paper p="md" radius="lg" className={classes.noteCard}>
                <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed" mb="xs">Notes ETS</Text>
                <Text size="sm" c="dimmed">
                  {data.notes?.trim() || 'Aucune note renseignée pour cet établissement.'}
                </Text>
              </Paper>
            </Stack>
          ) : null}

          {activeTab === 'applications' ? (
            data.applications.length > 0 ? (
              <Stack gap="sm">
                {data.applications.map((application) => (
                  <Paper key={application.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{application.title}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="outline" size="xs">{application.type}</Badge>
                          <Badge variant="outline" size="xs">{application.source || 'Source directe'}</Badge>
                          <Text size="xs" c="dimmed">Postulé le {formatDate(application.applied_at)}</Text>
                        </Group>
                      </Stack>
                      <StatusBadge status={application.status} />
                    </Group>
                    <Group mt="sm" gap="xs">
                      {application.next_followup_at ? (
                        <Badge variant="outline" size="xs">Relance: {formatDate(application.next_followup_at)}</Badge>
                      ) : null}
                      <Link to={`/app/candidatures/${application.id}`}>
                        <Text size="xs" c="blue">Ouvrir la candidature</Text>
                      </Link>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">Aucune candidature liée à cet ETS.</Text>
            )
          ) : null}

          {activeTab === 'contacts' ? (
            data.contacts.length > 0 ? (
              <Stack gap="sm">
                {data.contacts.map((contact) => (
                  <Paper key={contact.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{contact.first_name} {contact.last_name}</Text>
                        <Group gap="xs" wrap="wrap">
                          {contact.role ? <Badge variant="outline" size="xs">{contact.role}</Badge> : null}
                          {contact.is_recruiter ? <Badge variant="light" color="pink" size="xs">Recruteur</Badge> : null}
                        </Group>
                      </Stack>
                      <Button variant="ghost" size="small" onClick={() => setEditingContact(contact)}>Éditer</Button>
                    </Group>
                    <Group mt="sm" gap="xs" wrap="wrap">
                      {contact.email ? <Badge variant="outline" size="xs">{contact.email}</Badge> : null}
                      {contact.phone ? <Badge variant="outline" size="xs">{contact.phone}</Badge> : null}
                      {contact.linkedin_url ? (
                        <a href={contact.linkedin_url} target="_blank" rel="noreferrer">
                          <Text size="xs" c="blue">LinkedIn</Text>
                        </a>
                      ) : null}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">Aucun contact rattaché à cet ETS.</Text>
            )
          ) : null}

          {activeTab === 'activity' ? (
            data.events.length > 0 ? (
              <Stack gap="sm">
                {data.events.map((event) => (
                  <Paper key={`${event.id}-${event.ts}`} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4}>
                        <Text fw={700} size="sm">{formatEventLabel(event.type || event.event_type)}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="outline" size="xs">{formatDate(event.ts, true)}</Badge>
                          {event.application ? <Badge variant="outline" size="xs">{event.application.title}</Badge> : null}
                          {event.contact ? <Badge variant="outline" size="xs">{event.contact.name}</Badge> : null}
                        </Group>
                      </Stack>
                    </Group>
                    {event.payload && Object.keys(event.payload).length > 0 ? (
                      <Text size="xs" c="dimmed" mt={6}>{JSON.stringify(event.payload)}</Text>
                    ) : null}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">Aucune activité récente pour cet ETS.</Text>
            )
          ) : null}
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Stack gap="md">
            <Stack gap="xs" pb="md" className={classes.sectionDivider}>
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Informations ETS</Text>
              {[
                { label: 'Nom', value: data.name },
                { label: 'Type', value: data.type },
                { label: 'Ville', value: data.city || 'Non renseignée' },
                { label: 'Site web', value: data.website || 'Non renseigné' },
                { label: 'LinkedIn', value: data.linkedin_url || 'Non renseigné' },
              ].map((item) => (
                <Group key={item.label} justify="space-between">
                  <Text size="xs" c="dimmed">{item.label}</Text>
                  <Text size="xs" fw={600}>{item.value}</Text>
                </Group>
              ))}
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">Vue liée</Text>
              {[
                { label: 'Candidatures', value: data.applications.length },
                { label: 'Contacts', value: data.contacts.length },
                { label: 'Événements', value: data.events.length },
              ].map((item) => (
                <Group key={item.label} justify="space-between">
                  <Text size="xs" c="dimmed">{item.label}</Text>
                  <Text size="xs" fw={600}>{item.value}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>

      {editingOrganization ? (
        <OrganizationEditModal
          organization={data}
          onClose={() => setEditingOrganization(false)}
          onSaved={() => {
            setEditingOrganization(false);
            fetchCompany();
          }}
        />
      ) : null}

      {editingContact ? (
        <ContactEditModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() => {
            setEditingContact(null);
            fetchCompany();
          }}
        />
      ) : null}
    </Stack>
  );
};

export default CompanyDetailsPage;
