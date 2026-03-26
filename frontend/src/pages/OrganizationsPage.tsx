import React, { useEffect, useState } from 'react';
import { organizationService } from '../services/api';
import {Title} from '../components/atoms/Title';
import { Spinner } from '../components/atoms/Spinner';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import type { Organization } from '../types';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getAll({ 
        type: typeFilter || undefined,
        search: search || undefined
      });
      setOrganizations(data);
    } catch (err) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [typeFilter, search]);

  const organizationTypes = [
    'CLIENT_FINAL', 'ESN', 'CABINET_RECRUTEMENT', 'STARTUP', 'PME', 'GRAND_COMPTE', 'PORTAGE', 'AUTRE'
  ];

  return (
    <div className="organizations-page p-lg">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <Title>Établissements</Title>
          <p className="text-sm text-secondary">{organizations.length} établissements au total</p>
        </div>
        <button className="btn btn-primary">+ NOUVEL ETS</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
        <div className="md:col-span-3">
          <input 
            className="input w-full" 
            placeholder="Rechercher par nom..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="input w-full"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            {organizationTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="notification is-danger">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {organizations.length === 0 ? (
            <div className="col-span-full text-center py-xl text-secondary italic">
              Aucun établissement trouvé.
            </div>
          ) : (
            organizations.map(org => (
              <div key={org.id} className="card p-md hover:border-blue-500 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-sm">
                  <div>
                    <h3 className="font-bold text-lg">{org.name}</h3>
                    <div className="flex gap-xs items-center mt-xs">
                      <OrganizationTypeBadge type={org.type} size="xs" />
                      {org.city && <span className="text-xs text-secondary">📍 {org.city}</span>}
                    </div>
                  </div>
                  <ProbityBadge score={org.probity_score} level={org.probity_level} />
                </div>
                
                <div className="mt-md pt-md border-t border-gray-800 grid grid-cols-2 gap-sm text-xs">
                  <div>
                    <span className="text-secondary">Candidatures:</span>
                    <span className="ml-1 font-bold">{org.total_applications}</span>
                  </div>
                  <div>
                    <span className="text-secondary">Taux réponse:</span>
                    <span className="ml-1 font-bold">{org.response_rate}%</span>
                  </div>
                  <div>
                    <span className="text-secondary">Délai moyen:</span>
                    <span className="ml-1 font-bold">{org.avg_response_days || '?'} j</span>
                  </div>
                  <div>
                    <span className="text-secondary">Ghosting:</span>
                    <span className={`ml-1 font-bold ${org.ghosting_count > 0 ? 'text-red-400' : ''}`}>{org.ghosting_count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
