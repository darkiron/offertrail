import React, { useState, useEffect } from 'react';
import { applicationService, organizationService } from '../../services/api';
import type { Organization } from '../../types';
import ProbityBadge from '../atoms/ProbityBadge';
import OrganizationTypeBadge from '../atoms/OrganizationTypeBadge';

interface NewApplicationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    type: 'CDI',
    status: 'APPLIED',
    source: '',
    job_url: '',
    applied_at: new Date().toISOString().split('T')[0],
    next_followup_at: '',
    org_type: 'AUTRE'
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations);
  }, []);

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(formData.company.toLowerCase())
  ).slice(0, 5);

  const matchedOrg = organizations.find(o => o.name.toLowerCase() === formData.company.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await applicationService.createApplication(formData);
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Failed to create application', error);
      setError(error.response?.data?.detail || 'Failed to create application. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'company') {
      setShowOrgDropdown(true);
    }
  };

  const selectOrg = (org: Organization) => {
    setFormData({ ...formData, company: org.name });
    setShowOrgDropdown(false);
  };

  return (
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
        <h2 className="text-xl font-bold mb-lg">Add New Application</h2>
        
        {error && (
          <div className="alert alert-error mb-lg">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          <div className="flex gap-md">
            <div className="flex-grow relative">
              <label className="text-sm font-bold text-dim mb-xs block">Company *</label>
              <input 
                name="company" 
                className="input w-full" 
                required 
                value={formData.company} 
                onChange={handleChange} 
                onFocus={() => setShowOrgDropdown(true)}
                autoComplete="off"
              />
              {showOrgDropdown && formData.company && filteredOrgs.length > 0 && !matchedOrg && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl">
                  {filteredOrgs.map(org => (
                    <div 
                      key={org.id} 
                      className="p-sm hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                      onClick={() => selectOrg(org)}
                    >
                      <span className="font-bold">{org.name}</span>
                      <ProbityBadge score={org.probity_score} level={org.probity_level} showScore={false} />
                    </div>
                  ))}
                </div>
              )}
              {matchedOrg && (
                <div className="mt-xs flex gap-xs items-center">
                  <OrganizationTypeBadge type={matchedOrg.type} size="xs" />
                  <ProbityBadge score={matchedOrg.probity_score} level={matchedOrg.probity_level} size="sm" />
                </div>
              )}
              {!matchedOrg && formData.company && (
                <div className="mt-xs">
                  <label className="text-[10px] font-bold text-accent uppercase block mb-1">New organization type</label>
                  <select name="org_type" className="input text-xs py-1 h-auto" value={formData.org_type} onChange={handleChange}>
                    <option value="CLIENT_FINAL">Client Final</option>
                    <option value="ESN">ESN</option>
                    <option value="CABINET_RECRUTEMENT">Cabinet</option>
                    <option value="STARTUP">Startup</option>
                    <option value="PME">PME</option>
                    <option value="GRAND_COMPTE">Grand Compte</option>
                    <option value="PORTAGE">Portage</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Job Title *</label>
              <input name="title" className="input" required value={formData.title} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-md">
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Type</label>
              <select name="type" className="input" value={formData.type} onChange={handleChange}>
                <option value="CDI">CDI</option>
                <option value="FREELANCE">FREELANCE</option>
                <option value="CDD">CDD</option>
                <option value="INTERN">INTERNSHIP</option>
              </select>
            </div>
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Initial Status</label>
              <select name="status" className="input" value={formData.status} onChange={handleChange}>
                <option value="INTERESTED">INTERESTED</option>
                <option value="APPLIED">APPLIED</option>
                <option value="INTERVIEW">INTERVIEW</option>
                <option value="OFFER">OFFER</option>
              </select>
            </div>
          </div>

          <div className="flex gap-md">
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Source</label>
              <input name="source" className="input" placeholder="LinkedIn, Referral..." value={formData.source} onChange={handleChange} />
            </div>
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Job URL</label>
              <input name="job_url" className="input" placeholder="https://..." value={formData.job_url} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-md">
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Date Applied</label>
              <input name="applied_at" type="date" className="input" value={formData.applied_at} onChange={handleChange} />
            </div>
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Next Follow-up</label>
              <input name="next_followup_at" type="date" className="input" value={formData.next_followup_at} onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-between mt-lg">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
