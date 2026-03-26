import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Title } from '../atoms/Title';
import { Spinner } from '../atoms/Spinner';
import OrganizationTypeBadge from '../atoms/OrganizationTypeBadge';
import ProbityBadge from '../atoms/ProbityBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { Button } from '../atoms/Button';
import OrganizationEditModal from './OrganizationEditModal';

interface OrganizationDetailDrawerProps {
  organizationId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const OrganizationDetailDrawer: React.FC<OrganizationDetailDrawerProps> = ({ 
  organizationId, 
  onClose, 
  onUpdate 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (organizationId) {
      setLoading(true);
      api.getCompany(organizationId)
        .then(setData)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [organizationId]);

  if (!organizationId) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: '520px' }}>
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <Spinner />
          </div>
        ) : data ? (
          <>
            <div className="p-lg border-bottom">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <Title level={3} className="mb-1">{data.name}</Title>
                  <OrganizationTypeBadge type={data.type} size="sm" />
                </div>
                <div className="flex gap-sm">
                  {data.linkedin_url && (
                    <a href={data.linkedin_url} target="_blank" rel="noreferrer" className="button is-small is-ghost">LinkedIn</a>
                  )}
                  {data.website && (
                    <a href={data.website} target="_blank" rel="noreferrer" className="button is-small is-ghost">Site</a>
                  )}
                  <button className="delete" onClick={onClose}></button>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="tabs px-lg">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Aperçu</button>
                <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Candidatures</button>
                <button className={`tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>Contacts</button>
              </div>

              <div className="p-lg">
                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-lg">
                    <ProbityBadge 
                      score={data.metrics?.probity_score} 
                      level={data.metrics?.probity_level || 'insuffisant'} 
                      size="md"
                    />

                    <div className="detail-section">
                      <h4 className="text-xs font-mono uppercase text-secondary mb-md">À propos</h4>
                      <p className="text-sm text-secondary italic mb-md">{data.notes || "Aucune note."}</p>
                      <div className="grid grid-cols-2 gap-md text-sm">
                        <div>
                          <p className="text-xs text-secondary font-mono uppercase">Localisation</p>
                          <p>{data.city || "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary font-mono uppercase">Date création</p>
                          <p>{new Date(data.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'applications' && (
                  <div className="flex flex-col gap-sm">
                    {data.applications && data.applications.length > 0 ? (
                      data.applications.map((app: any) => (
                        <div key={app.id} className="card-secondary p-md rounded-sm flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm">{app.title}</p>
                            <p className="text-xs text-secondary">{new Date(app.applied_at).toLocaleDateString()}</p>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary italic text-sm text-center py-lg">Aucune candidature pour cet ETS.</p>
                    )}
                  </div>
                )}

                {activeTab === 'contacts' && (
                  <div className="flex flex-col gap-sm">
                    <div className="flex justify-end mb-md">
                      <Button variant="ghost" size="small">+ AJOUTER CONTACT</Button>
                    </div>
                    {data.contacts && data.contacts.length > 0 ? (
                      data.contacts.map((c: any) => (
                        <div key={c.id} className="card-secondary p-md rounded-sm flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-secondary">{c.role}</p>
                            <div className="flex gap-md mt-2">
                              {c.email && <span className="text-[10px] font-mono text-secondary">{c.email}</span>}
                              {c.is_recruiter && <span className="tag-status" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'var(--ot-accent-pink)' }}>RECRUTEUR</span>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary italic text-sm text-center py-lg">Aucun contact enregistré.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-lg border-top flex gap-md">
              <Button variant="primary" className="flex-grow" onClick={() => setEditing(true)}>MODIFIER ETS</Button>
            </div>

            {editing && data && (
              <OrganizationEditModal 
                organization={data}
                onClose={() => setEditing(false)}
                onSaved={async () => { 
                  setEditing(false);
                  // refresh data
                  setLoading(true);
                  try { const refreshed = await api.getCompany(organizationId); setData(refreshed); } finally { setLoading(false); }
                }}
              />
            )}
          </>
        ) : (
          <div className="p-lg text-center text-secondary">Établissement introuvable.</div>
        )}
      </div>
    </>
  );
};
