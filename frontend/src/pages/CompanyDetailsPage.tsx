import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Title } from '../components/atoms/Title';
import { Spinner } from '../components/atoms/Spinner';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import StatusBadge from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import OrganizationEditModal from '../components/organisms/OrganizationEditModal';
import ContactEditModal from '../components/organisms/ContactEditModal';
import type { Application, Contact, Organization } from '../types';

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

const pageStyles = `
  .company-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
    color: var(--text-main);
  }

  .company-backLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 700;
  }

  .company-hero,
  .company-summaryCard,
  .company-contentCard,
  .company-sideCard,
  .company-listItem,
  .company-activityItem {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .company-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .company-heroTitleRow,
  .company-chipRow,
  .company-actions,
  .company-tabs,
  .company-metricGrid,
  .company-metaGrid,
  .company-linkedMeta,
  .company-contactMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .company-chipRow {
    margin-top: 12px;
  }

  .company-heroText {
    max-width: 720px;
    margin: 16px 0 0;
    color: var(--text-dim);
    line-height: 1.6;
    font-size: 15px;
  }

  .company-actions {
    margin-top: 22px;
  }

  .company-summaryRail {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .company-summaryCard {
    padding: 18px;
  }

  .company-eyebrow,
  .company-statLabel,
  .company-sectionLabel {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .company-statValue {
    margin-top: 10px;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .company-statHint {
    margin-top: 8px;
    color: var(--text-dim);
    font-size: 13px;
  }

  .company-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
    gap: 20px;
    align-items: start;
  }

  .company-contentCard,
  .company-sideCard {
    padding: 20px;
  }

  .company-tabs {
    margin-bottom: 18px;
  }

  .company-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .company-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    color: var(--text-main);
  }

  .company-metricGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .company-metric {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 76%, var(--bg-mantle) 24%);
  }

  .company-noteCard {
    margin-top: 18px;
    padding: 18px;
    border-radius: 18px;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.18);
    line-height: 1.7;
  }

  .company-list,
  .company-activityList {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .company-listItem,
  .company-activityItem {
    padding: 18px;
  }

  .company-linkedTop {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .company-linkedTitle {
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
  }

  .company-linkedMeta,
  .company-contactMeta {
    margin-top: 10px;
  }

  .company-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 7px 11px;
    background: color-mix(in srgb, var(--bg-base) 78%, var(--bg-mantle) 22%);
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    color: var(--text-dim);
    font-size: 12px;
    font-weight: 700;
  }

  .company-linkCta {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }

  .company-sideCard {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .company-sideSection {
    padding-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .company-sideSection:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .company-metaGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .company-metaValue {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.5;
  }

  .company-empty {
    padding: 40px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  .company-error {
    padding: 48px 20px;
    text-align: center;
  }

  @media (max-width: 1120px) {
    .company-hero,
    .company-layout,
    .company-summaryRail {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .company-shell {
      padding: 18px;
      gap: 18px;
    }

    .company-metricGrid {
      grid-template-columns: 1fr;
    }
  }
`;

const tabDefinitions: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Apercu' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'activity', label: 'Activite' },
];

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('fr-FR', withTime ? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } : {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
    case 'fiable':
      return score !== null ? 'Signal favorable et documente.' : 'Signal favorable.';
    case 'moyen':
      return 'Signal mitige a surveiller.';
    case 'méfiance':
      return 'Signal de risque eleve.';
    case 'insuffisant':
      return 'Manque de donnees: a traiter comme signal faible.';
    default:
      return 'Signal faible.';
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
    if (!id) {
      return;
    }
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
      <div className="company-shell">
        <style>{pageStyles}</style>
        <div className="company-contentCard company-empty">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="company-shell">
        <style>{pageStyles}</style>
        <div className="company-contentCard company-error">
          <p>{error || 'ETS introuvable.'}</p>
          <Link to="/organizations" className="company-backLink">Retour aux etablissements</Link>
        </div>
      </div>
    );
  }

  const responseRate = data.response_rate ?? 0;
  const positiveRate = data.positive_rate ?? 0;
  const rejectionRate = Math.max(0, Math.min(100, Math.round(responseRate - positiveRate)));
  const dueFollowups = data.applications.filter(
    (application) => Boolean(application.next_followup_at) && application.status !== 'REJECTED' && application.status !== 'OFFER',
  ).length;

  return (
    <div className="company-shell">
      <style>{pageStyles}</style>

      <Link to="/organizations" className="company-backLink">
        Retour aux etablissements
      </Link>

      <section className="company-hero">
        <div>
          <span className="company-eyebrow">Fiche detail ETS</span>
          <div className="company-heroTitleRow">
            <Title>{data.name}</Title>
          </div>
          <div className="company-chipRow">
            <OrganizationTypeBadge type={data.type} />
            <ProbityBadge score={data.probity_score} level={data.probity_level} />
            {data.city ? <span className="company-pill">{data.city}</span> : null}
          </div>
          <p className="company-heroText">
            Verifie les informations de l&apos;organisation, consulte les candidatures liees, ouvre les contacts utiles et
            mets a jour la fiche ETS sans quitter la page.
          </p>
          <div className="company-actions">
            <Button variant="primary" onClick={() => setEditingOrganization(true)}>Modifier la fiche ETS</Button>
            <Link to={`/organizations/maintenance?source=${data.id}`}>
              <Button variant="ghost">Maintenance ETS</Button>
            </Link>
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
          </div>
        </div>

        <div className="company-sideCard">
          <div className="company-sideSection">
            <span className="company-sectionLabel">Synthese rapide</span>
            <div className="company-metaGrid">
              <div>
                <span className="company-statLabel">Derniere mise a jour</span>
                <div className="company-metaValue">{formatDate(data.updated_at, true)}</div>
              </div>
              <div>
                <span className="company-statLabel">Creation de la fiche</span>
                <div className="company-metaValue">{formatDate(data.created_at)}</div>
              </div>
              <div>
                <span className="company-statLabel">Contacts lies</span>
                <div className="company-metaValue">{data.contacts.length}</div>
              </div>
            </div>
          </div>
          <div className="company-sideSection">
            <span className="company-sectionLabel">Cadence</span>
            <div className="company-metaValue">
              {dueFollowups > 0 ? `${dueFollowups} relance(s) a surveiller` : 'Aucune relance en attente'}
            </div>
          </div>
        </div>
      </section>

      <section className="company-summaryRail">
        <div className="company-summaryCard">
          <span className="company-statLabel">Candidatures</span>
          <div className="company-statValue">{data.total_applications}</div>
          <div className="company-statHint">volume cumule sur cette organisation</div>
        </div>
        <div className="company-summaryCard">
          <span className="company-statLabel">Taux de reponse</span>
          <div className="company-statValue">{responseRate}%</div>
          <div className="company-statHint">retours detectes sur les candidatures</div>
        </div>
        <div className="company-summaryCard">
          <span className="company-statLabel">Taux positif</span>
          <div className="company-statValue">{positiveRate}%</div>
          <div className="company-statHint">entretiens ou offres</div>
        </div>
        <div className="company-summaryCard">
          <span className="company-statLabel">Ghosting</span>
          <div className="company-statValue">{data.ghosting_count}</div>
          <div className="company-statHint">dossiers sans retour apres 30 jours</div>
        </div>
      </section>

      <section className="company-layout">
        <div className="company-contentCard">
          <div className="company-tabs">
            {tabDefinitions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`company-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' ? (
            <>
              <div className="company-metricGrid">
                <div className="company-metric">
                  <span className="company-statLabel">Temps moyen de reponse</span>
                  <div className="company-statValue">{data.avg_response_days ?? '-'}</div>
                  <div className="company-statHint">jours avant premier retour</div>
                </div>
                <div className="company-metric">
                  <span className="company-statLabel">Taux de rejet estime</span>
                  <div className="company-statValue">{rejectionRate}%</div>
                  <div className="company-statHint">derive depuis les signaux de statut</div>
                </div>
                <div className="company-metric">
                  <span className="company-statLabel">Reponses constatees</span>
                  <div className="company-statValue">{data.total_responses}</div>
                  <div className="company-statHint">sur l&apos;ensemble des candidatures</div>
                </div>
                <div className="company-metric">
                  <span className="company-statLabel">Signal probite</span>
                  <div style={{ marginTop: 10 }}>
                    <ProbityBadge score={data.probity_score} level={data.probity_level} size="md" />
                  </div>
                  <div className="company-statHint">{getProbityHint(data.probity_level, data.probity_score)}</div>
                </div>
              </div>

              <div className="company-noteCard">
                <span className="company-statLabel">Notes ETS</span>
                <div className="company-metaValue">
                  {data.notes?.trim() || 'Aucune note renseignee pour cet etablissement.'}
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'applications' ? (
            data.applications.length > 0 ? (
              <div className="company-list">
                {data.applications.map((application) => (
                  <div key={application.id} className="company-listItem">
                    <div className="company-linkedTop">
                      <div>
                        <h3 className="company-linkedTitle">{application.title}</h3>
                        <div className="company-linkedMeta">
                          <span className="company-pill">{application.type}</span>
                          <span className="company-pill">{application.source || 'Source directe'}</span>
                          <span className="company-pill">Postule le {formatDate(application.applied_at)}</span>
                        </div>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                    <div className="company-linkedMeta">
                      {application.next_followup_at ? (
                        <span className="company-pill">Relance: {formatDate(application.next_followup_at)}</span>
                      ) : null}
                      <Link to={`/applications/${application.id}`} className="company-linkCta">
                        Ouvrir la candidature
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="company-empty">Aucune candidature liee a cet ETS.</div>
            )
          ) : null}

          {activeTab === 'contacts' ? (
            data.contacts.length > 0 ? (
              <div className="company-list">
                {data.contacts.map((contact) => (
                  <div key={contact.id} className="company-listItem">
                    <div className="company-linkedTop">
                      <div>
                        <h3 className="company-linkedTitle">{contact.first_name} {contact.last_name}</h3>
                        <div className="company-contactMeta">
                          {contact.role ? <span className="company-pill">{contact.role}</span> : null}
                          {contact.is_recruiter ? <span className="company-pill">Recruteur</span> : null}
                        </div>
                      </div>
                      <Button variant="ghost" size="small" onClick={() => setEditingContact(contact)}>Editer</Button>
                    </div>
                    <div className="company-contactMeta">
                      {contact.email ? <span className="company-pill">{contact.email}</span> : null}
                      {contact.phone ? <span className="company-pill">{contact.phone}</span> : null}
                      {contact.linkedin_url ? (
                        <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="company-linkCta">
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="company-empty">Aucun contact rattache a cet ETS.</div>
            )
          ) : null}

          {activeTab === 'activity' ? (
            data.events.length > 0 ? (
              <div className="company-activityList">
                {data.events.map((event) => (
                  <div key={`${event.id}-${event.ts}`} className="company-activityItem">
                    <div className="company-linkedTop">
                      <div>
                        <h3 className="company-linkedTitle">{formatEventLabel(event.type || event.event_type)}</h3>
                        <div className="company-contactMeta">
                          <span className="company-pill">{formatDate(event.ts, true)}</span>
                          {event.application ? <span className="company-pill">{event.application.title}</span> : null}
                          {event.contact ? <span className="company-pill">{event.contact.name}</span> : null}
                        </div>
                      </div>
                    </div>
                    {event.payload && Object.keys(event.payload).length > 0 ? (
                      <div className="company-metaValue">
                        {JSON.stringify(event.payload)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="company-empty">Aucune activite recente pour cet ETS.</div>
            )
          ) : null}
        </div>

        <aside className="company-sideCard">
          <div className="company-sideSection">
            <span className="company-sectionLabel">Informations ETS</span>
            <div className="company-metaGrid">
              <div>
                <span className="company-statLabel">Nom</span>
                <div className="company-metaValue">{data.name}</div>
              </div>
              <div>
                <span className="company-statLabel">Type</span>
                <div className="company-metaValue">{data.type}</div>
              </div>
              <div>
                <span className="company-statLabel">Ville</span>
                <div className="company-metaValue">{data.city || 'Non renseignee'}</div>
              </div>
              <div>
                <span className="company-statLabel">Site web</span>
                <div className="company-metaValue">{data.website || 'Non renseigne'}</div>
              </div>
              <div>
                <span className="company-statLabel">LinkedIn</span>
                <div className="company-metaValue">{data.linkedin_url || 'Non renseigne'}</div>
              </div>
            </div>
          </div>
          <div className="company-sideSection">
            <span className="company-sectionLabel">Vue liee</span>
            <div className="company-metaGrid">
              <div>
                <span className="company-statLabel">Candidatures</span>
                <div className="company-metaValue">{data.applications.length}</div>
              </div>
              <div>
                <span className="company-statLabel">Contacts</span>
                <div className="company-metaValue">{data.contacts.length}</div>
              </div>
              <div>
                <span className="company-statLabel">Evenements</span>
                <div className="company-metaValue">{data.events.length}</div>
              </div>
            </div>
          </div>
        </aside>
      </section>

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
    </div>
  );
};

export default CompanyDetailsPage;
