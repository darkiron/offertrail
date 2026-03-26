import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../molecules/StatusBadge';
import { Title } from '../atoms/Title';
import { Spinner } from '../atoms/Spinner';
import { OrganizationTypeBadge } from '../molecules/OrganizationTypeBadge';
import { ProbityBadge } from '../molecules/ProbityBadge';

interface ApplicationDetailDrawerProps {
  appId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const ApplicationDetailDrawer: React.FC<ApplicationDetailDrawerProps> = ({ appId, onClose, onUpdate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (appId) {
      setLoading(true);
      api.getApplication(appId)
        .then(setData)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [appId]);

  if (!appId) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <Spinner />
          </div>
        ) : data ? (
          <>
            <div className="p-lg border-bottom">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <Title level={3} className="mb-1">{data.application.title}</Title>
                  <p className="text-secondary font-medium">
                    {data.application.organization?.name || data.application.company_name}
                  </p>
                </div>
                <button className="delete" onClick={onClose}></button>
              </div>
              <div className="flex gap-sm">
                <StatusBadge status={data.application.status} />
                {data.organization?.type && <OrganizationTypeBadge type={data.organization.type} size="xs" />}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="tabs px-lg">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Aperçu</button>
                <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Timeline</button>
              </div>

              <div className="p-lg">
                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-lg">
                    {data.organization && (
                      <ProbityBadge 
                        score={data.organization.metrics?.probity_score} 
                        level={data.organization.metrics?.probity_level || 'insuffisant'} 
                        size="md"
                      />
                    )}

                    <div className="detail-section">
                      <h4 className="text-xs font-mono uppercase text-secondary mb-md">Informations</h4>
                      <div className="grid grid-cols-2 gap-md">
                        <div>
                          <p className="text-xs text-secondary">Candidaté le</p>
                          <p className="text-sm">{new Date(data.application.applied_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Canal</p>
                          <p className="text-sm">{data.application.channel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4 className="text-xs font-mono uppercase text-secondary mb-md">Notes</h4>
                      <div className="card-secondary p-md rounded-sm whitespace-pre-wrap text-sm italic">
                        {data.application.notes || "Aucune note."}
                      </div>
                    </div>

                    {data.contacts && data.contacts.length > 0 && (
                      <div className="detail-section">
                        <h4 className="text-xs font-mono uppercase text-secondary mb-md">Contacts</h4>
                        <div className="flex flex-col gap-sm">
                          {data.contacts.map((c: any) => (
                            <div key={c.id} className="flex justify-between items-center text-sm p-sm bg-ot-bg-base rounded-sm">
                              <span>{c.first_name} {c.last_name}</span>
                              <span className="text-secondary text-xs">{c.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="timeline">
                    {data.events && data.events.length > 0 ? (
                      data.events.map((event: any, idx: number) => (
                        <div key={event.id || idx} className="timeline-item pb-lg border-l-2 border-light pl-md ml-xs relative">
                          <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1" />
                          <p className="text-xs text-secondary font-mono">{new Date(event.ts).toLocaleString()}</p>
                          <p className="text-sm font-bold">{event.type}</p>
                          {event.payload && Object.keys(event.payload).length > 0 && (
                            <div className="text-xs text-secondary mt-1 bg-ot-bg-base p-1 rounded-xs">
                              {JSON.stringify(event.payload)}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary italic text-sm">Aucun événement enregistré.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-lg border-top flex gap-md">
              <Button variant="ghost" className="flex-grow">MODIFIER</Button>
              <Button variant="ghost" className="flex-grow">ARCHIVER</Button>
            </div>
          </>
        ) : (
          <div className="p-lg text-center text-secondary">Candidature introuvable.</div>
        )}
      </div>
    </>
  );
};
