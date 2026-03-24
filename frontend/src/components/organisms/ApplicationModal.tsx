import React, { useState, useEffect } from 'react';
import { Modal } from '../atoms/Modal';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';
import { api } from '../../services/api';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicationId?: number; // If provided, it's an Edit modal
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  applicationId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_id: '',
    new_company_name: '',
    title: '',
    status: 'APPLIED',
    applied_at: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset or load data
      if (applicationId) {
        // Load application data for edit
      }
    }
  }, [isOpen, applicationId]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const results = await api.searchCompanies(searchQuery);
        setCompanies(results);
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) fetchCompanies();
  }, [searchQuery, isOpen]);

  const handleSubmit = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        new_company_name: formData.company_id ? '' : searchQuery,
      };
      await api.createApplication(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'APPLIED', label: 'Applied' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'FOLLOW_UP', label: 'Follow Up' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={applicationId ? 'Edit Application' : 'New Application'}
      footer={
        <>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            {applicationId ? 'Save Changes' : 'Create Application'}
          </Button>
          <Button variant="light" onClick={onClose} className="ml-2">Cancel</Button>
        </>
      }
    >
      <div className="field">
        <label className="label">Company</label>
        <div className="control">
          <Input 
            placeholder="Search or enter new company name" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {companies.length > 0 && searchQuery && (
          <div className="box p-2 mt-1" style={{ position: 'absolute', zIndex: 10, width: '100%' }}>
            {companies.map(c => (
              <div 
                key={c.id} 
                className="p-2 is-clickable hover-bg-light"
                onClick={() => {
                  setFormData({...formData, company_id: c.id});
                  setSearchQuery(c.name);
                  setCompanies([]);
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label className="label">Job Title</label>
        <div className="control">
          <Input 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required
            placeholder="e.g. Senior Backend Developer"
          />
        </div>
      </div>

      <div className="columns">
        <div className="column">
          <Select 
            label="Status" 
            options={statusOptions} 
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />
        </div>
        <div className="column">
          <Input 
            label="Applied At" 
            type="date" 
            value={formData.applied_at}
            onChange={(e) => setFormData({...formData, applied_at: e.target.value})}
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Notes</label>
        <div className="control">
          <textarea 
            className="textarea" 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};
