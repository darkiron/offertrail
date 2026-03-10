import React, { useState } from 'react';
import { applicationService } from '../../services/api';

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
    next_followup_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div className="flex-grow">
              <label className="text-sm font-bold text-dim mb-xs block">Company *</label>
              <input name="company" className="input" required value={formData.company} onChange={handleChange} />
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
