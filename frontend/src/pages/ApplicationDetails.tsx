import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationService } from '../services/api';

export const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '' });

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setError(null);
      const details = await applicationService.getApplication(parseInt(id));
      setData(details);
    } catch (error: any) {
      console.error('Error fetching application details:', error);
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (!id) return;
    await applicationService.updateApplication(parseInt(id), { status });
    fetchDetails();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;
    await applicationService.addNote(parseInt(id), newNote);
    setNewNote('');
    fetchDetails();
  };

  const handleMarkFollowup = async () => {
    if (!id) return;
    await applicationService.markFollowup(parseInt(id));
    fetchDetails();
  };

  const handleResponseReceived = async () => {
    if (!id) return;
    await applicationService.addEvent(parseInt(id), 'RESPONSE_RECEIVED');
    fetchDetails();
  };

  const handleLinkContact = async (contactId: number) => {
    if (!id) return;
    await applicationService.linkContact(parseInt(id), contactId);
    setShowContactModal(false);
    fetchDetails();
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !contactForm.name) return;
    await applicationService.createContact(parseInt(id), contactForm);
    setContactForm({ name: '', email: '', phone: '', company: '' });
    setShowContactModal(false);
    fetchDetails();
  };

  const formatEventType = (type: string) => {
    if (!type) return 'UNKNOWN';
    const mapping: Record<string, string> = {
      'CREATED': 'Application Created',
      'STATUS_CHANGED': 'Status Updated',
      'NOTE_ADDED': 'Note Added',
      'CONTACT_CREATED': 'Contact Created',
      'CONTACT_LINKED': 'Contact Linked',
      'FOLLOWUP_SENT': 'Follow-up Sent',
      'RESPONSE_RECEIVED': 'Response Received',
      'INTERVIEW_SCHEDULED': 'Interview Scheduled',
      'OFFER_RECEIVED': 'Offer Received',
      'APPLICATION_CREATED': 'Application Created', // Legacy/Compatibility
      'FOLLOWED_UP': 'Followed Up', // Legacy/Compatibility
    };
    return mapping[type] || type.replace(/_/g, ' ');
  };

  const renderEventPayload = (event: any) => {
    const type = event.type || event.event_type; // Handle both possible field names
    switch (type) {
      case 'STATUS_CHANGED':
        return event.payload?.old_status && (
          <p className="mt-xs text-sm">
            Changed from <strong>{event.payload.old_status}</strong> to <strong>{event.payload.new_status}</strong>
          </p>
        );
      case 'NOTE_ADDED':
        return event.payload?.text && (
          <div className="mt-xs text-sm whitespace-pre-wrap card-secondary p-sm border-radius-sm">{event.payload.text}</div>
        );
      case 'CONTACT_CREATED':
        return event.payload?.name && (
          <p className="mt-xs text-sm">
            Contact created: <strong>{event.payload.name}</strong>
            {event.payload.company && ` (${event.payload.company})`}
          </p>
        );
      case 'CONTACT_LINKED':
        return event.payload?.contact_name ? (
          <p className="mt-xs text-sm">Linked to <strong>{event.payload.contact_name}</strong></p>
        ) : event.payload?.contact_id && (
          <p className="mt-xs text-sm">Linked to contact ID: <strong>{event.payload.contact_id}</strong></p>
        );
      case 'CREATED':
      case 'APPLICATION_CREATED':
        return event.payload?.company && (
          <div className="mt-xs text-sm text-dim">
            Initial application for <strong>{event.payload.company}</strong> as <strong>{event.payload.title}</strong>
          </div>
        );
      case 'FOLLOWUP_SENT':
        return event.payload?.next_followup_at && (
          <p className="mt-xs text-sm">
            Follow-up sent. Next follow-up scheduled for: <strong>{event.payload.next_followup_at}</strong>
          </p>
        );
      case 'RESPONSE_RECEIVED':
        return (
          <p className="mt-xs text-sm">
            Employer responded to the application.
          </p>
        );
      default:
        // Generic fallback for any other events with text or just data
        if (event.payload?.text) return <p className="mt-xs text-sm">{event.payload.text}</p>;
        if (event.payload && Object.keys(event.payload).length > 0) {
          return (
            <div className="mt-xs text-xs text-dim italic">
              {JSON.stringify(event.payload)}
            </div>
          );
        }
        return null;
    }
  };

  if (loading && !data) return (
    <div className="container mt-lg has-text-centered text-dim" style={{ padding: '4rem' }}>
      <div className="loading-spinner mb-md"></div>
      <p>Loading application details...</p>
    </div>
  );
  if (!data && !loading) return (
    <div className="container mt-lg has-text-centered">
      <div className="alert alert-error mb-lg">{error || 'Application not found.'}</div>
      <Link to="/" className="btn-ghost">Back to Dashboard</Link>
    </div>
  );

  const { application: app, events, contacts, all_contacts } = data || { application: {}, events: [], contacts: [], all_contacts: [] };

  return (
    <div className="container mt-lg">
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-lg">
              <h2 className="text-xl font-bold">Add Contact</h2>
              <button className="btn-ghost" onClick={() => setShowContactModal(false)}>✕</button>
            </div>
            
            <div className="tabs mb-lg">
              <button className={`tab ${!isLinking ? 'active' : ''}`} onClick={() => setIsLinking(false)}>Create New</button>
              <button className={`tab ${isLinking ? 'active' : ''}`} onClick={() => setIsLinking(true)}>Link Existing</button>
            </div>

            {!isLinking ? (
              <form onSubmit={handleCreateContact} className="flex-col gap-md">
                <input 
                  className="input" 
                  placeholder="Name (Required)" 
                  value={contactForm.name} 
                  onChange={e => setContactForm({...contactForm, name: e.target.value})} 
                  required
                />
                <input 
                  className="input" 
                  placeholder="Email" 
                  value={contactForm.email} 
                  onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                />
                <input 
                  className="input" 
                  placeholder="Phone" 
                  value={contactForm.phone} 
                  onChange={e => setContactForm({...contactForm, phone: e.target.value})} 
                />
                <input 
                  className="input" 
                  placeholder="Company" 
                  value={contactForm.company} 
                  onChange={e => setContactForm({...contactForm, company: e.target.value})} 
                />
                <button type="submit" className="btn-primary w-full">Create and Link Contact</button>
              </form>
            ) : (
              <div className="flex-col gap-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {all_contacts?.filter((c: any) => !contacts.some((rc: any) => rc.id === c.id)).map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center p-sm border-bottom hover-dim" style={{ cursor: 'pointer' }} onClick={() => handleLinkContact(c.id)}>
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-dim">{c.company}</div>
                    </div>
                    <button className="btn-ghost text-sm">Link</button>
                  </div>
                ))}
                {all_contacts?.length === 0 && <p className="text-dim italic p-md">No existing contacts found.</p>}
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-error mb-lg">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchDetails}>Retry</button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-lg">
        <div>
          <Link to="/" className="text-sm text-dim mb-xs block">← Back to Dashboard</Link>
          <h1 className="text-xxl font-bold">{app.company}</h1>
          <p className="text-lg text-dim">{app.title}</p>
        </div>
        <div className="flex gap-md">
          <select 
            className="input" 
            value={app.status} 
            onChange={(e) => handleUpdateStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="INTERESTED">INTERESTED</option>
            <option value="APPLIED">APPLIED</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="OFFER">OFFER</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button className="btn-ghost" onClick={handleResponseReceived}>Réponse reçue</button>
          <button className="btn-primary" onClick={handleMarkFollowup}>Mark Follow-up Done</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-lg)' }}>
        <div className="flex-col gap-lg">
          <div className="card">
            <h2 className="text-lg font-bold mb-md">Timeline</h2>
            <div className="flex-col gap-md">
              {events.map((event: any, i: number) => (
                <div key={i} className="flex gap-md pb-md" style={{ borderLeft: '2px solid var(--border)', paddingLeft: 'var(--spacing-md)', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-7px', 
                    top: '0', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--accent)' 
                  }} />
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm">{formatEventType(event.type || event.event_type)}</span>
                      <span className="text-sm text-dim">{new Date(event.ts).toLocaleString()}</span>
                    </div>
                    {renderEventPayload(event)}
                  </div>
                </div>
              ))}
              {events.length === 0 && <p className="text-dim italic">No events recorded yet.</p>}
            </div>
            
            <form onSubmit={handleAddNote} className="mt-lg">
              <label className="text-sm font-bold text-dim mb-xs block">Quick Note</label>
              <div className="flex-col gap-sm">
                <textarea 
                  className="input" 
                  style={{ minHeight: '80px', width: '100%', padding: '0.75rem' }}
                  placeholder="Type a note..." 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }}>Add Note</button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-col gap-lg">
          <div className="card">
            <h2 className="text-lg font-bold mb-md">Details</h2>
            <div className="flex-col gap-sm text-sm">
              <div className="flex justify-between">
                <span className="text-dim">Status</span>
                <span className={`tag status-${app.status.toLowerCase()}`}>{app.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Type</span>
                <span className="font-bold">{app.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Source</span>
                <span className="font-bold">{app.source || 'Direct'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Applied At</span>
                <span className="font-bold">{app.applied_at || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Follow-up</span>
                <span className="font-bold text-rejected">{app.next_followup_at || '-'}</span>
              </div>
            </div>
            {app.job_url && (
              <a href={app.job_url} target="_blank" rel="noreferrer" className="btn-ghost mt-lg block has-text-centered">
                View Job Description ↗
              </a>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-md">
              <h2 className="text-lg font-bold">Contacts</h2>
              <button className="btn-ghost text-sm" onClick={() => setShowContactModal(true)}>+ Add</button>
            </div>
            {contacts.map((contact: any) => (
              <div key={contact.id} className="mb-md pb-md" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="font-bold">{contact.name}</div>
                <div className="text-sm text-dim">{contact.company || app.company}</div>
                {contact.email && <div className="text-sm mt-xs">📧 {contact.email}</div>}
                {contact.phone && <div className="text-sm">📞 {contact.phone}</div>}
              </div>
            ))}
            {contacts.length === 0 && <p className="text-dim italic text-sm">No contacts linked yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
