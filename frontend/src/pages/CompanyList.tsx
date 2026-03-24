import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../services/api';

export const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="container mt-lg p-lg has-text-centered text-dim"><div className="loading-spinner"></div><p>Loading companies...</p></div>;

  return (
    <div className="container mt-lg">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h1 className="text-xxl font-bold">Companies (ETS)</h1>
          <p className="text-dim">Directory of tracked companies</p>
        </div>
        <div className="flex gap-md">
          <input 
            className="input" 
            placeholder="Search companies..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
      </div>

      <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filteredCompanies.map(company => (
          <Link key={company.id} to={`/companies/${company.id}`} className="card hover-lift no-underline">
            <div className="flex justify-between items-start mb-md">
              <div>
                <h3 className="text-lg font-bold">{company.name}</h3>
                <span className="tag text-xs">{company.type}</span>
              </div>
              <div className={`status-indicator status-${company.global_flag_level || 'green'}`}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-sm text-sm text-dim mb-md">
              <div>
                <div className="font-bold text-main">{company.metrics?.total_apps || 0}</div>
                <div>Applications</div>
              </div>
              <div>
                <div className="font-bold text-main">{company.metrics?.response_rate || 0}%</div>
                <div>Response Rate</div>
              </div>
            </div>

            <div className="text-xs text-dim border-top pt-sm flex justify-between">
              <span>{company.location || 'No location'}</span>
              <span>{company.metrics?.last_interaction ? new Date(company.metrics.last_interaction).toLocaleDateString() : 'Never'}</span>
            </div>
          </Link>
        ))}
        {filteredCompanies.length === 0 && (
          <div className="card p-lg has-text-centered text-dim" style={{ gridColumn: '1 / -1' }}>
            No companies found.
          </div>
        )}
      </div>
    </div>
  );
};
