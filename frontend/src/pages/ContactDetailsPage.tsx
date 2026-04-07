import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { contactService } from '../services/api';
import type { Application, Contact, Organization } from '../types';
import { Button } from '../components/atoms/Button';
import StatusBadge from '../components/atoms/StatusBadge';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import ContactEditModal from '../components/organisms/ContactEditModal';
import { useI18n } from '../i18n';

type ContactDetails = Contact & {
  organization: Organization | null;
  applications: Application[];
  events: Array<{
    id: number;
    ts: string;
    type: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    application?: { id: number; title: string; status: string };
  }>;
};

type ContactTab = 'overview' | 'applications' | 'activity';

const pageStyles = `
  .contactdetail-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .contactdetail-hero,
  .contactdetail-mainCard,
  .contactdetail-sideCard,
  .contactdetail-listItem {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .contactdetail-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.85fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .contactdetail-kicker,
  .contactdetail-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .contactdetail-title {
    margin: 10px 0 0;
    font-size: 34px;
    line-height: 1.05;
  }

  .contactdetail-subtitle,
  .contactdetail-muted {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .contactdetail-chipRow,
  .contactdetail-actions,
  .contactdetail-tabs,
  .contactdetail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .contactdetail-chipRow,
  .contactdetail-actions {
    margin-top: 16px;
  }

  .contactdetail-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.8fr);
    gap: 20px;
    align-items: start;
  }

  .contactdetail-mainCard,
  .contactdetail-sideCard {
    padding: 20px;
  }

  .contactdetail-tabs {
    margin-bottom: 18px;
  }

  .contactdetail-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .contactdetail-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    color: var(--text-main);
  }

  .contactdetail-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .contactdetail-listItem {
    padding: 18px;
  }

  .contactdetail-sideCard {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .contactdetail-sideSection {
    padding-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .contactdetail-sideSection:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .contactdetail-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dim);
  }

  .contactdetail-empty {
    padding: 36px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1100px) {
    .contactdetail-hero,
    .contactdetail-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .contactdetail-shell {
      padding: 18px;
      gap: 18px;
    }
  }
`;

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

export const ContactDetailsPage: React.FC = () => {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContactTab>('overview');
  const [editing, setEditing] = useState(false);

  const fetchContact = async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await contactService.getById(Number(id));
      setData(response);
    } catch {
      setError(t('contacts.detailError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = 'Contact — OfferTrail'; }, []);

  useEffect(() => {
    fetchContact();
  }, [id]);

  if (loading && !data) {
    return (
      <div className="contactdetail-shell">
        <style>{pageStyles}</style>
        <div className="contactdetail-mainCard contactdetail-empty">{t('contacts.loadingDetail')}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="contactdetail-shell">
        <style>{pageStyles}</style>
        <div className="contactdetail-mainCard contactdetail-empty">{error || t('contacts.detailError')}</div>
      </div>
    );
  }

  const tabDefinitions: Array<{ id: ContactTab; label: string }> = [
    { id: 'overview', label: `◌ ${t('contacts.overview')}` },
    { id: 'applications', label: `◎ ${t('contacts.applications')}` },
    { id: 'activity', label: `◷ ${t('contacts.activity')}` },
  ];

  return (
    <div className="contactdetail-shell">
      <style>{pageStyles}</style>

      <Link to="/contacts" className="contactdetail-back">{t('common.backToContacts')}</Link>

      <section className="contactdetail-hero">
        <div>
          <div className="contactdetail-kicker">◌ {t('contacts.detailKicker')}</div>
          <h1 className="contactdetail-title">{data.first_name} {data.last_name}</h1>
          <p className="contactdetail-subtitle">{data.role || t('contacts.detailNoRole')}</p>
          <div className="contactdetail-chipRow">
            {data.is_recruiter ? <span className="contactdetail-label" style={{ color: '#fb7185' }}>◎ {t('contacts.recruiter')}</span> : null}
            {data.organization ? <OrganizationTypeBadge type={data.organization.type} /> : null}
            {data.organization ? <ProbityBadge score={data.organization.probity_score} level={data.organization.probity_level} showScore={false} /> : null}
          </div>
          <div className="contactdetail-actions">
            <Button variant="primary" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
            {data.email ? (
              <a href={`mailto:${data.email}`}>
                <Button variant="ghost">{t('contacts.sendEmail')}</Button>
              </a>
            ) : null}
            {data.linkedin_url ? (
              <a href={data.linkedin_url} target="_blank" rel="noreferrer">
                <Button variant="ghost">{t('contacts.linkedin')}</Button>
              </a>
            ) : null}
          </div>
        </div>

        <div className="contactdetail-sideCard">
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.linkedOrg')}</div>
            <div className="contactdetail-muted" style={{ marginTop: 6 }}>
              {data.organization ? (
                <button
                  type="button"
                  onClick={() => navigate(`/organizations/${data.organization?.id}`)}
                  style={{ background: 'transparent', padding: 0, color: 'var(--text-main)', border: 'none' }}
                >
                  {data.organization.name}
                </button>
              ) : t('contacts.noLinkedOrg')}
            </div>
          </div>
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.applicationsLinked')}</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{data.applications.length}</div>
          </div>
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.updatedAt')}</div>
            <div className="contactdetail-muted" style={{ marginTop: 6 }}>{formatDate(data.updated_at, true)}</div>
          </div>
        </div>
      </section>

      <section className="contactdetail-layout">
        <div className="contactdetail-mainCard">
          <div className="contactdetail-tabs">
            {tabDefinitions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`contactdetail-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' ? (
            <div className="contactdetail-list">
              <div className="contactdetail-listItem">
                <div className="contactdetail-label">✉ {t('contacts.email')}</div>
                <div className="contactdetail-muted" style={{ marginTop: 8 }}>{data.email || t('contacts.notDefined')}</div>
              </div>
              <div className="contactdetail-listItem">
                <div className="contactdetail-label">☎ {t('contacts.phone')}</div>
                <div className="contactdetail-muted" style={{ marginTop: 8 }}>{data.phone || t('contacts.notDefined')}</div>
              </div>
              <div className="contactdetail-listItem">
                <div className="contactdetail-label">{t('contacts.notes')}</div>
                <div className="contactdetail-muted" style={{ marginTop: 8 }}>{data.notes || t('contacts.noNotes')}</div>
              </div>
            </div>
          ) : null}

          {activeTab === 'applications' ? (
            data.applications.length > 0 ? (
              <div className="contactdetail-list">
                {data.applications.map((application) => (
                  <div key={application.id} className="contactdetail-listItem">
                    <div className="flex justify-between items-start gap-md">
                      <div>
                        <div className="font-bold">{application.title}</div>
                        <div className="contactdetail-meta">
                          <span className="contactdetail-muted">{application.company}</span>
                          <span className="contactdetail-muted">{application.type}</span>
                          <span className="contactdetail-muted">{t('dashboard.applied')} {formatDate(application.applied_at)}</span>
                        </div>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link to={`/applications/${application.id}`}>{t('contacts.openApplication')}</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="contactdetail-empty">{t('contacts.noApplications')}</div>
            )
          ) : null}

          {activeTab === 'activity' ? (
            data.events.length > 0 ? (
              <div className="contactdetail-list">
                {data.events.map((event) => (
                  <div key={`${event.id}-${event.ts}`} className="contactdetail-listItem">
                    <div className="font-bold">{String(event.type || event.event_type).replace(/_/g, ' ')}</div>
                    <div className="contactdetail-muted">{formatDate(event.ts, true)}</div>
                    {event.application ? (
                      <div className="contactdetail-meta" style={{ marginTop: 8 }}>
                        <span className="contactdetail-muted">{event.application.title}</span>
                        <StatusBadge status={event.application.status} size="sm" />
                      </div>
                    ) : null}
                    {event.payload && Object.keys(event.payload).length > 0 ? (
                      <div className="contactdetail-muted" style={{ marginTop: 10 }}>{JSON.stringify(event.payload)}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="contactdetail-empty">{t('contacts.noActivity')}</div>
            )
          ) : null}
        </div>

        <aside className="contactdetail-sideCard">
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.identity')}</div>
            <div className="contactdetail-muted" style={{ marginTop: 6 }}>{data.first_name} {data.last_name}</div>
            <div className="contactdetail-muted">{data.role || t('contacts.noRole')}</div>
          </div>
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.channels')}</div>
            <div className="contactdetail-muted" style={{ marginTop: 6 }}>{data.email || t('contacts.noEmail')}</div>
            <div className="contactdetail-muted">{data.phone || t('contacts.noPhone')}</div>
          </div>
          <div className="contactdetail-sideSection">
            <div className="contactdetail-label">{t('contacts.created')}</div>
            <div className="contactdetail-muted" style={{ marginTop: 6 }}>{formatDate(data.created_at)}</div>
          </div>
        </aside>
      </section>

      {editing ? (
        <ContactEditModal
          contact={data}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            fetchContact();
          }}
        />
      ) : null}
    </div>
  );
};

export default ContactDetailsPage;
