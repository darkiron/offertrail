import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companyService } from '../services/api';

export const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const details = await companyService.getCompany(parseInt(id));
      setData(details);
      setEditData(details);
    } catch (err) {
      setError('Failed to load company details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await companyService.updateCompany(parseInt(id), editData);
      setIsEditing(false);
      fetchDetails();
    } catch (err) {
      setError('Failed to update company.');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) return <div className="container mt-lg p-lg has-text-centered text-dim"><div className="loading-spinner"></div><p>Loading company details...</p></div>;
  if (!data || !data.name) return <div className="container mt-lg p-lg has-text-centered"><div className="alert alert-error">{error || 'Company not found'}</div><Link to="/companies" className="btn-ghost mt-md">Back to companies</Link></div>;

  const company = data;
  const metrics = data.metrics || {
    total_apps: 0,
    total_offers: 0,
    rejections: 0,
    no_responses: 0,
    interviews: 0,
    rejection_rate: 0,
    ghosting_rate: 0,
    response_rate: 0,
    interview_rate: 0,
    last_interaction: null
  };
  const flags = data.flags || [];
  const global_flag_level = data.global_flag_level || 'green';

  return (
    <div className="container mt-lg">
      <div className="flex justify-between items-start mb-lg">
        <div>
          <Link to="/companies" className="text-sm text-dim mb-xs block">← Back to Companies</Link>
          <div className="flex items-center gap-md">
            <h1 className="text-xxl font-bold">{company.name}</h1>
            <div className={`status-indicator status-${global_flag_level}`}></div>
          </div>
          <p className="text-dim">{company.type} • {company.location || 'No location'}</p>
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="text-accent text-sm">{company.website}</a>}
        </div>
        <div className="flex flex-wrap gap-sm">
          <button className="btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit Company</button>
          {flags.map((flag: string) => (
            <span key={flag} className="tag tag-error text-xs font-bold">{flag.replace(/_/g, ' ')}</span>
          ))}
          {flags.length === 0 && <span className="tag tag-success text-xs font-bold">RELIABLE RESPONDER</span>}
        </div>
      </div>

      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--spacing-md)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-base)' }}>
            <h2 className="text-xl font-bold mb-lg">Edit Company</h2>
            <form onSubmit={handleUpdate} className="flex-col gap-md">
              <div>
                <label className="text-sm font-bold text-dim mb-xs block">Name</label>
                <input className="input" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
              </div>
              <div className="flex gap-md">
                <div className="flex-grow">
                  <label className="text-sm font-bold text-dim mb-xs block">Type</label>
                  <select className="input" value={editData.type} onChange={e => setEditData({...editData, type: e.target.value})}>
                    <option value="ESN">ESN</option>
                    <option value="CABINET">CABINET</option>
                    <option value="STARTUP">STARTUP</option>
                    <option value="SCALE_UP">SCALE UP</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="ASSOCIATION">ASSOCIATION</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="flex-grow">
                  <label className="text-sm font-bold text-dim mb-xs block">Website</label>
                  <input className="input" value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-dim mb-xs block">Location</label>
                <input className="input" value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-dim mb-xs block">Description</label>
                <textarea className="input" style={{ minHeight: '100px', width: '100%' }} value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-dim mb-xs block">Notes</label>
                <textarea className="input" style={{ minHeight: '80px', width: '100%' }} value={editData.notes || ''} onChange={e => setEditData({...editData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-md mt-lg">
                <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-md mb-lg">
        <div className="card has-text-centered">
          <div className="text-xxl font-bold">{metrics.total_apps}</div>
          <div className="text-sm text-dim">Applications</div>
        </div>
        <div className="card has-text-centered">
          <div className="text-xxl font-bold">{metrics.response_rate}%</div>
          <div className="text-sm text-dim">Response Rate</div>
        </div>
        <div className="card has-text-centered">
          <div className="text-xxl font-bold">{metrics.rejections}</div>
          <div className="text-sm text-dim">Rejections</div>
        </div>
        <div className="card has-text-centered">
          <div className="text-xxl font-bold">{metrics.ghosting_rate}%</div>
          <div className="text-sm text-dim">Ghosting Rate</div>
        </div>
      </div>

      <div className="grid gap-lg" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="flex-col gap-lg">
          <div className="card">
            <h2 className="text-lg font-bold mb-md">About</h2>
            <div className="text-main mb-lg whitespace-pre-wrap">{company.description || 'No description available.'}</div>
            
            <h2 className="text-lg font-bold mb-md">Applications</h2>
            <div className="table-container">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Applied At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {company.applications?.map((app: any) => (
                    <tr key={app.id}>
                      <td><div className="font-bold">{app.offer_id ? 'Offer #' + app.offer_id : 'Spontaneous'}</div></td>
                      <td><span className={`tag status-${app.status.toLowerCase()}`}>{app.status}</span></td>
                      <td>{app.applied_at || '-'}</td>
                      <td><Link to={`/applications/${app.id}`} className="btn-ghost btn-sm">View Details</Link></td>
                    </tr>
                  ))}
                  {(!company.applications || company.applications.length === 0) && (
                    <tr><td colSpan={4} className="has-text-centered text-dim italic">No applications recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex-col gap-lg">
          <div className="card">
            <h2 className="text-lg font-bold mb-md">Contacts</h2>
            <div className="flex-col gap-sm">
              {company.contacts?.map((contact: any) => (
                <div key={contact.id} className="pb-sm border-bottom last-no-border">
                  <div className="font-bold">{contact.first_name} {contact.last_name}</div>
                  <div className="text-xs text-dim">{contact.role}</div>
                  {contact.email && <div className="text-xs mt-xs">📧 {contact.email}</div>}
                </div>
              ))}
              {(!company.contacts || company.contacts.length === 0) && (
                <p className="text-dim italic text-sm">No contacts recorded yet.</p>
              )}
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-bold mb-md">Notes</h2>
            <div className="text-sm text-main whitespace-pre-wrap">{company.notes || 'No notes.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
