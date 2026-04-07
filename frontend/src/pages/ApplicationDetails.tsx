import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { applicationService, organizationService } from '../services/api';
import ProbityBadge from '../components/atoms/ProbityBadge';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import StatusBadge, { statusLabelMap } from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import type { Organization } from '../types';

const pageStyles = `
  .appdetail-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .appdetail-hero,
  .appdetail-mainCard,
  .appdetail-sideCard,
  .appdetail-event,
  .appdetail-contactCard,
  .appdetail-modal {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .appdetail-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.85fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .appdetail-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dim);
  }

  .appdetail-kicker,
  .appdetail-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .appdetail-title {
    margin: 10px 0 0;
    font-size: 34px;
    line-height: 1.05;
  }

  .appdetail-subtitle {
    margin: 10px 0 0;
    color: var(--text-dim);
    font-size: 16px;
  }

  .appdetail-chipRow,
  .appdetail-actions,
  .appdetail-meta,
  .appdetail-contactMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .appdetail-chipRow {
    margin-top: 14px;
  }

  .appdetail-actions {
    margin-top: 22px;
  }

  .appdetail-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
    gap: 20px;
    align-items: start;
  }

  .appdetail-mainCard,
  .appdetail-sideCard {
    padding: 20px;
  }

  .appdetail-sectionTitle {
    margin: 0 0 16px;
    font-size: 20px;
  }

  .appdetail-eventList,
  .appdetail-contactList {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .appdetail-event {
    padding: 18px;
  }

  .appdetail-eventTop,
  .appdetail-contactTop {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .appdetail-muted {
    color: var(--text-dim);
    font-size: 14px;
    line-height: 1.6;
  }

  .appdetail-noteForm {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .appdetail-textarea {
    min-height: 110px;
    width: 100%;
    resize: vertical;
  }

  .appdetail-sideCard {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .appdetail-sideSection {
    padding-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .appdetail-sideSection:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .appdetail-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .appdetail-contactCard {
    padding: 16px;
  }

  .appdetail-modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.58);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .appdetail-modal {
    width: min(720px, 100%);
    padding: 20px;
  }

  .appdetail-modalTabs {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .appdetail-modalTab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .appdetail-modalTab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    color: var(--text-main);
  }

  .appdetail-modalGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .appdetail-empty {
    padding: 36px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1100px) {
    .appdetail-hero,
    .appdetail-layout,
    .appdetail-modalGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .appdetail-shell {
      padding: 18px;
      gap: 18px;
    }
  }
`;

export const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [finalCustomerSearch, setFinalCustomerSearch] = useState('');
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    is_recruiter: 0,
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchDetails = async () => {
    if (!id) {
      return;
    }
    try {
      setError(null);
      const [details, organizationsData] = await Promise.all([
        applicationService.getApplication(parseInt(id, 10)),
        organizationService.getAll(),
      ]);
      setData(details);
      setOrganizations(organizationsData);
      setFinalCustomerSearch(details.final_customer_organization?.name || '');
    } catch (fetchError: any) {
      if (fetchError.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (fetchError.response?.status === 402) {
        navigate('/app/pricing?reason=limit_reached');
        return;
      }
      setError(fetchError.response?.data?.detail || 'Impossible de charger le detail de la candidature.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Candidature — OfferTrail';
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (!id) {
      return;
    }
    try {
      await applicationService.updateApplication(parseInt(id, 10), { status });
      showToast('Statut mis a jour');
      fetchDetails();
    } catch (updateError: any) {
      if (updateError.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(updateError.response?.data?.detail || 'Impossible de mettre a jour le statut.');
    }
  };

  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !newNote.trim()) {
      return;
    }
    try {
      await applicationService.addNote(parseInt(id, 10), newNote);
      setNewNote('');
      fetchDetails();
    } catch (noteError: any) {
      setError(noteError.response?.data?.detail || 'Impossible d\'ajouter la note.');
    }
  };

  const handleMarkFollowup = async () => {
    if (!id) {
      return;
    }
    try {
      await applicationService.markFollowup(parseInt(id, 10));
      fetchDetails();
    } catch (followupError: any) {
      setError(followupError.response?.data?.detail || 'Impossible de mettre a jour la relance.');
    }
  };

  const handleResponseReceived = async () => {
    if (!id) {
      return;
    }
    try {
      await applicationService.addEvent(parseInt(id, 10), 'RESPONSE_RECEIVED');
      fetchDetails();
    } catch (eventError: any) {
      setError(eventError.response?.data?.detail || 'Impossible d\'ajouter l\'evenement.');
    }
  };

  const handleLinkContact = async (contactId: number) => {
    if (!id) {
      return;
    }
    try {
      await applicationService.linkContact(parseInt(id, 10), contactId);
      setShowContactModal(false);
      fetchDetails();
    } catch (linkError: any) {
      setError(linkError.response?.data?.detail || 'Impossible de lier le contact.');
    }
  };

  const handleCreateContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !contactForm.first_name || !contactForm.last_name) {
      return;
    }
    const orgId = data?.organization?.id;
    try {
      await applicationService.createContact(parseInt(id, 10), {
        ...contactForm,
        organization_id: orgId,
      });
      setContactForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        is_recruiter: 0,
      });
      setShowContactModal(false);
      fetchDetails();
    } catch (createError: any) {
      setError(createError.response?.data?.detail || 'Impossible de creer le contact.');
    }
  };

  const handleSetFinalCustomer = async (organizationId: number | null) => {
    if (!id) {
      return;
    }
    try {
      await applicationService.updateApplication(parseInt(id, 10), {
        final_customer_organization_id: organizationId,
      });
      fetchDetails();
    } catch (customerError: any) {
      setError(customerError.response?.data?.detail || 'Impossible de mettre a jour le client final.');
    }
  };

  const statusOptions = [
    { value: 'INTERESTED', label: statusLabelMap.INTERESTED },
    { value: 'APPLIED', label: statusLabelMap.APPLIED },
    { value: 'INTERVIEW', label: statusLabelMap.INTERVIEW },
    { value: 'OFFER', label: statusLabelMap.OFFER },
    { value: 'REJECTED', label: statusLabelMap.REJECTED },
  ];
  const getStatusLabel = (status?: string | null) => statusLabelMap[String(status || '').toUpperCase()] || status || '-';

  const formatEventType = (type: string) => {
    const mapping: Record<string, string> = {
      CREATED: 'Creation',
      UPDATED: 'Mise a jour',
      STATUS_CHANGED: 'Statut',
      NOTE_ADDED: 'Note',
      CONTACT_CREATED: 'Contact cree',
      CONTACT_LINKED: 'Contact lie',
      FOLLOWUP_SENT: 'Relance',
      RESPONSE_RECEIVED: 'Reponse',
      INTERVIEW_SCHEDULED: 'Entretien',
      OFFER_RECEIVED: 'Offre',
      APPLICATION_CREATED: 'Creation',
      FOLLOWED_UP: 'Relance',
    };
    return mapping[type] || type.replace(/_/g, ' ');
  };

  const renderEventPayload = (event: any) => {
    const type = event.type || event.event_type;
    switch (type) {
      case 'STATUS_CHANGED':
        return event.payload?.old_status
          ? `${getStatusLabel(event.payload.old_status)} -> ${getStatusLabel(event.payload.new_status)}`
          : (event.payload?.new_status ? getStatusLabel(event.payload.new_status) : null);
      case 'UPDATED':
        if (event.payload?.status) {
          return `Statut: ${getStatusLabel(event.payload.status)}`;
        }
        if (event.payload?.final_customer_organization_id !== undefined) {
          return event.payload.final_customer_organization_id ? 'Client final lie' : 'Client final retire';
        }
        if (event.payload?.organization_id) {
          return 'Organisation mise a jour';
        }
        return 'Informations mises a jour';
      case 'NOTE_ADDED':
        return event.payload?.text || null;
      case 'CONTACT_CREATED':
        return event.payload?.name ? `Contact: ${event.payload.name}` : null;
      case 'CONTACT_LINKED':
        return event.payload?.contact_name || event.payload?.contact_id ? `Contact lie: ${event.payload?.contact_name || `#${event.payload?.contact_id}`}` : null;
      case 'CREATED':
      case 'APPLICATION_CREATED':
        return event.payload?.company ? `${event.payload.company} · ${event.payload.title}` : null;
      case 'FOLLOWUP_SENT':
        return event.payload?.next_followup_at ? `Prochaine relance: ${event.payload.next_followup_at}` : null;
      case 'RESPONSE_RECEIVED':
        return 'Retour recu';
      default:
        return event.payload?.text || null;
    }
  };

  if (loading && !data) {
    return (
      <div className="appdetail-shell">
        <style>{pageStyles}</style>
        <div className="appdetail-mainCard appdetail-empty">Loading application details...</div>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div className="appdetail-shell">
        <style>{pageStyles}</style>
        <div className="appdetail-mainCard appdetail-empty">
          <div>{error || 'Application not found.'}</div>
          <div style={{ marginTop: 12 }}>
            <Link to="/app">
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { application: app, organization, final_customer_organization, events, contacts, all_contacts } = data || {
    application: {},
    organization: null,
    final_customer_organization: null,
    events: [],
    contacts: [],
    all_contacts: [],
  };
  const finalCustomerCandidates = organizations
    .filter((candidate) => !['ESN', 'CABINET_RECRUTEMENT', 'PORTAGE'].includes(candidate.type))
    .filter((candidate) => candidate.name.toLowerCase().includes(finalCustomerSearch.toLowerCase()))
    .slice(0, 6);
  const shouldShowFinalCustomerLink = organization?.type === 'ESN' || organization?.type === 'CABINET_RECRUTEMENT' || !!final_customer_organization;

  return (
    <div className="appdetail-shell">
      <style>{pageStyles}</style>

      {toast ? (
        <div style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 9999,
          padding: '10px 18px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.18)',
          color: '#86efac',
          border: '1px solid rgba(16, 185, 129, 0.34)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {toast}
        </div>
      ) : null}

      {showContactModal ? (
        <div className="appdetail-modalOverlay" onClick={() => setShowContactModal(false)}>
          <div className="appdetail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="appdetail-contactTop" style={{ marginBottom: 16 }}>
              <div>
                <div className="appdetail-kicker">Contact management</div>
                <h2 className="appdetail-sectionTitle" style={{ marginBottom: 0 }}>Add contact</h2>
              </div>
              <Button variant="ghost" size="small" onClick={() => setShowContactModal(false)}>Close</Button>
            </div>

            <div className="appdetail-modalTabs">
              <button type="button" className={`appdetail-modalTab ${!isLinking ? 'is-active' : ''}`} onClick={() => setIsLinking(false)}>
                Create new
              </button>
              <button type="button" className={`appdetail-modalTab ${isLinking ? 'is-active' : ''}`} onClick={() => setIsLinking(true)}>
                Link existing
              </button>
            </div>

            {!isLinking ? (
              <form onSubmit={handleCreateContact} className="appdetail-noteForm">
                <div className="appdetail-modalGrid">
                  <input className="input" placeholder="First name" value={contactForm.first_name} onChange={(event) => setContactForm({ ...contactForm, first_name: event.target.value })} required />
                  <input className="input" placeholder="Last name" value={contactForm.last_name} onChange={(event) => setContactForm({ ...contactForm, last_name: event.target.value })} required />
                  <input className="input" placeholder="Email" type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} />
                  <input className="input" placeholder="Phone" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} />
                  <input className="input" placeholder="Role" value={contactForm.role} onChange={(event) => setContactForm({ ...contactForm, role: event.target.value })} />
                  <label className="appdetail-check appdetail-muted">
                    <input type="checkbox" checked={contactForm.is_recruiter === 1} onChange={(event) => setContactForm({ ...contactForm, is_recruiter: event.target.checked ? 1 : 0 })} />
                    Est recruteur
                  </label>
                </div>
                <div>
                  <Button type="submit" variant="primary">Create and link</Button>
                </div>
              </form>
            ) : (
              <div className="appdetail-contactList" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {all_contacts?.filter((contact: any) => !contacts.some((related: any) => related.id === contact.id)).map((contact: any) => (
                  <div key={contact.id} className="appdetail-contactCard">
                    <div className="appdetail-contactTop">
                      <div>
                        <div><strong>{contact.first_name} {contact.last_name}</strong></div>
                        <div className="appdetail-muted">{contact.role || 'Contact'}</div>
                      </div>
                      <Button variant="ghost" size="small" onClick={() => handleLinkContact(contact.id)}>Link</Button>
                    </div>
                  </div>
                ))}
                {all_contacts?.length === 0 ? <div className="appdetail-empty">No existing contacts found.</div> : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchDetails}>Retry</button>
        </div>
      ) : null}

      <Link to="/app" className="appdetail-back">Back to dashboard</Link>

      <section className="appdetail-hero">
        <div>
          <div className="appdetail-kicker">Application record</div>
          <h1 className="appdetail-title">{app.company}</h1>
          <p className="appdetail-subtitle">{app.title}</p>
          <div className="appdetail-chipRow">
            <StatusBadge status={app.status} />
            {organization ? <OrganizationTypeBadge type={organization.type} /> : null}
            {organization ? <ProbityBadge score={organization.probity_score} level={organization.probity_level} /> : null}
          </div>
          <div className="appdetail-actions">
            <select className="input" value={app.status} onChange={(event) => handleUpdateStatus(event.target.value)} style={{ width: 'auto' }}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button variant="ghost" onClick={handleResponseReceived}>Response received</Button>
            <Button variant="primary" onClick={handleMarkFollowup}>Mark follow-up done</Button>
          </div>
        </div>

        <div className="appdetail-sideCard">
          <div className="appdetail-sideSection">
            <div className="appdetail-label">Applied</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{app.applied_at || '-'}</div>
            <div className="appdetail-muted">source: {app.source || 'Direct'}</div>
          </div>
          <div className="appdetail-sideSection">
            <div className="appdetail-label">Follow-up</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{app.next_followup_at || '-'}</div>
            <div className="appdetail-muted">next checkpoint for this application</div>
          </div>
          <div className="appdetail-sideSection">
            <div className="appdetail-label">Organization</div>
            <div className="appdetail-muted" style={{ marginTop: 6 }}>
              {organization ? (
                <Link to={`/app/etablissements/${organization.id}`}>{organization.name}</Link>
              ) : 'No linked organization'}
            </div>
          </div>
          {shouldShowFinalCustomerLink ? (
            <div className="appdetail-sideSection">
              <div className="appdetail-label">Final customer</div>
              <div className="appdetail-muted" style={{ marginTop: 6 }}>
                {final_customer_organization ? (
                  <Link to={`/app/etablissements/${final_customer_organization.id}`}>{final_customer_organization.name}</Link>
                ) : 'Not linked yet'}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="appdetail-layout">
        <div className="appdetail-mainCard">
          <h2 className="appdetail-sectionTitle">Timeline</h2>
          <div className="appdetail-eventList">
            {events.map((event: any, index: number) => (
              <div key={`${event.id || index}-${event.ts}`} className="appdetail-event">
                <div className="appdetail-eventTop">
                  <div>
                    <div><strong>{formatEventType(event.type || event.event_type)}</strong></div>
                    <div className="appdetail-muted">{new Date(event.ts).toLocaleString()}</div>
                  </div>
                </div>
                {renderEventPayload(event) ? (
                  <div className="appdetail-muted" style={{ marginTop: 10 }}>{renderEventPayload(event)}</div>
                ) : null}
              </div>
            ))}
            {events.length === 0 ? <div className="appdetail-empty">No events recorded yet.</div> : null}
          </div>

          <form onSubmit={handleAddNote} className="appdetail-noteForm">
            <label className="appdetail-label">Quick note</label>
            <textarea className="input appdetail-textarea" placeholder="Type a note..." value={newNote} onChange={(event) => setNewNote(event.target.value)} />
            <div>
              <Button type="submit" variant="primary">Add note</Button>
            </div>
          </form>
        </div>

        <div className="appdetail-sideCard">
          <div className="appdetail-sideSection">
            <h2 className="appdetail-sectionTitle">Details</h2>
            <div className="appdetail-grid">
              <div>
                <div className="appdetail-label">Status</div>
                <div style={{ marginTop: 8 }}><StatusBadge status={app.status} /></div>
              </div>
              <div>
                <div className="appdetail-label">Type</div>
                <div className="appdetail-muted">{app.type}</div>
              </div>
              <div>
                <div className="appdetail-label">Source</div>
                <div className="appdetail-muted">{app.source || 'Direct'}</div>
              </div>
              {shouldShowFinalCustomerLink ? (
                <div>
                  <div className="appdetail-label">Client final</div>
                  <div className="appdetail-muted">
                    {final_customer_organization ? final_customer_organization.name : 'Aucun lien'}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="appdetail-label">Applied at</div>
                <div className="appdetail-muted">{app.applied_at || '-'}</div>
              </div>
            </div>
            {shouldShowFinalCustomerLink ? (
              <div style={{ marginTop: 16 }}>
                <div className="appdetail-label">Lier un client final</div>
                <input
                  className="input"
                  placeholder="Rechercher un client final"
                  value={finalCustomerSearch}
                  onChange={(event) => setFinalCustomerSearch(event.target.value)}
                  style={{ marginTop: 8 }}
                />
                <div className="appdetail-contactList" style={{ marginTop: 12 }}>
                  {finalCustomerCandidates.map((candidate) => (
                    <div key={candidate.id} className="appdetail-contactCard">
                      <div className="appdetail-contactTop">
                        <div>
                          <div><strong>{candidate.name}</strong></div>
                          <div className="appdetail-contactMeta">
                            <span className="appdetail-muted">{candidate.city || 'Ville non renseignee'}</span>
                            <OrganizationTypeBadge type={candidate.type} size="xs" />
                          </div>
                        </div>
                        <Button variant="ghost" size="small" onClick={() => handleSetFinalCustomer(candidate.id)}>
                          Lier
                        </Button>
                      </div>
                    </div>
                  ))}
                  {final_customer_organization ? (
                    <Button variant="ghost" size="small" onClick={() => handleSetFinalCustomer(null)}>
                      Retirer le client final
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {app.job_url ? (
              <div style={{ marginTop: 16 }}>
                <a href={app.job_url} target="_blank" rel="noreferrer">
                  <Button variant="ghost">View job description</Button>
                </a>
              </div>
            ) : null}
          </div>

          <div className="appdetail-sideSection">
            <div className="appdetail-contactTop">
              <h2 className="appdetail-sectionTitle" style={{ marginBottom: 0 }}>Contacts</h2>
              <Button variant="ghost" size="small" onClick={() => setShowContactModal(true)}>Add</Button>
            </div>
            <div className="appdetail-contactList">
              {contacts.map((contact: any) => (
                <div key={contact.id} className="appdetail-contactCard">
                  <div className="appdetail-contactTop">
                    <div>
                      <div><strong>{contact.first_name} {contact.last_name}</strong></div>
                      <div className="appdetail-contactMeta">
                        {contact.is_recruiter === 1 ? <span className="appdetail-muted">Recruiter</span> : null}
                        <span className="appdetail-muted">{contact.role || 'Contact'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="appdetail-contactMeta" style={{ marginTop: 10 }}>
                    {contact.email ? <span className="appdetail-muted">{contact.email}</span> : null}
                    {contact.phone ? <span className="appdetail-muted">{contact.phone}</span> : null}
                  </div>
                </div>
              ))}
              {contacts.length === 0 ? <div className="appdetail-empty">No contacts linked yet.</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
