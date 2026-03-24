import React, { useState, useEffect } from 'react';
import { applicationService, companyService } from '../../services/api';

interface NewApplicationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    company: '',
    company_id: null as number | null,
    title: '',
    type: 'CDI',
    status: 'APPLIED',
    source: 'OTHER',
    channel: 'OTHER',
    job_url: '',
    notes: '',
    applied_at: new Date().toISOString().split('T')[0],
  });
  
  const [companySearch, setCompanySearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (companySearch.length > 1 && !formData.company_id) {
        try {
          const results = await companyService.searchCompanies(companySearch);
          setSearchResults(results);
          setShowResults(true);
        } catch (err) {
          console.error('Error searching companies:', err);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [companySearch, formData.company_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company && !formData.company_id) {
      setError('Please select or enter a company.');
      return;
    }
    
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectCompany = (company: any) => {
    setFormData({ ...formData, company: company.name, company_id: company.id });
    setCompanySearch(company.name);
    setShowResults(false);
    setError(null);
  };

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanySearch(e.target.value);
    setFormData({ ...formData, company: e.target.value, company_id: null });
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
      <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
        <h2 className="text-xl font-bold mb-lg">Add New Application</h2>
        
        {error && (
          <div className="alert alert-error mb-lg">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          <div className="flex-col gap-sm" style={{ position: 'relative' }}>
            <label className="text-sm font-bold text-dim mb-xs block">Company *</label>
            <div className="flex gap-sm">
              <input 
                name="company" 
                className="input flex-grow" 
                autoComplete="off"
                placeholder="Type company name to search or create..."
                required 
                value={companySearch} 
                onChange={handleCompanyInputChange} 
                onFocus={() => companySearch.length > 1 && !formData.company_id && setShowResults(true)}
              />
              {formData.company_id && (
                <button type="button" className="btn-ghost btn-sm" onClick={() => {
                  setFormData({...formData, company: '', company_id: null});
                  setCompanySearch('');
                }}>Clear</button>
              )}
            </div>
            
            {showResults && searchResults.length > 0 && (
              <div className="card" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto',
                padding: 'var(--spacing-xs)',
                marginTop: '2px',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--bg-surface)'
              }}>
                {searchResults.map(c => (
                  <div 
                    key={c.id} 
                    className="p-sm hover-dim border-radius-sm" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectCompany(c)}
                  >
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="text-xs text-dim">Existing Company</div>
                  </div>
                ))}
              </div>
            )}
            {showResults && companySearch.length > 1 && searchResults.length === 0 && (
              <div className="card" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                padding: 'var(--spacing-sm)',
                marginTop: '2px',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--bg-surface)'
              }}>
                <div className="text-xs text-dim italic">New company <strong>"{companySearch}"</strong> will be created.</div>
              </div>
            )}
          </div>

          <div className="flex-grow">
            <label className="text-sm font-bold text-dim mb-xs block">Job Title (Optional)</label>
            <input name="title" className="input" placeholder="e.g. Senior Frontend" value={formData.title} onChange={handleChange} />
          </div>

          <div className="flex gap-md">
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Contract Type</label>
              <select name="type" className="input" value={formData.type} onChange={handleChange}>
                <option value="CDI">CDI</option>
                <option value="FREELANCE">FREELANCE</option>
                <option value="FIXED_TERM">CDD / Fixed Term</option>
                <option value="INTERNSHIP">INTERNSHIP</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Channel</label>
              <select name="channel" className="input" value={formData.channel} onChange={handleChange}>
                <option value="JOB_BOARD">Job Board</option>
                <option value="EMAIL">Direct Email</option>
                <option value="REFERRAL">Referral</option>
                <option value="DIRECT_WEBSITE">Company Website</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-md">
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Source</label>
              <select name="source" className="input" value={formData.source} onChange={handleChange}>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="INDEED">Indeed</option>
                <option value="WELCOME_TO_THE_JUNGLE">Welcome to the Jungle</option>
                <option value="DIRECT">Direct</option>
                <option value="OTHER">Other</option>
              </select>
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
              <label className="text-sm font-bold text-dim mb-xs block">Initial Status</label>
              <select name="status" className="input" value={formData.status} onChange={handleChange}>
                <option value="DRAFT">DRAFT</option>
                <option value="APPLIED">APPLIED</option>
                <option value="FOLLOW_UP">FOLLOW UP</option>
                <option value="INTERVIEW">INTERVIEW</option>
              </select>
            </div>
          </div>

          <div className="flex-grow">
            <label className="text-sm font-bold text-dim mb-xs block">Notes</label>
            <textarea name="notes" className="input" style={{ minHeight: '80px', width: '100%', resize: 'vertical' }} placeholder="Add any initial notes..." value={formData.notes} onChange={handleChange} />
          </div>

          <div className="flex justify-end gap-md mt-lg">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || (!formData.company && !formData.company_id)}>
              {loading ? 'Creating...' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
