import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ApplicationModel, mapApplicationDtoToModel } from '../domain/application/model';
import { ListPageTemplate } from '../components/templates/ListPageTemplate';
import { ApplicationTable } from '../components/organisms/ApplicationTable';
import { FilterBar } from '../components/organisms/FilterBar';
import { Button } from '../components/atoms/Button';

import { ApplicationModal } from '../components/organisms/ApplicationModal';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'APPLIED', label: 'Applied' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'FOLLOW_UP', label: 'Follow Up' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'GHOSTING', label: 'Ghosting' },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getApplications({ search, status });
      setApplications(response.items.map(mapApplicationDtoToModel));
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  const handleRowClick = (id: number) => {
    window.location.hash = `/applications/${id}`;
  };

  return (
    <>
      <ListPageTemplate
        title="Applications"
        isLoading={isLoading}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            New Application
          </Button>
        }
        filters={
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            statusOptions={statusOptions}
            onReset={() => { setSearch(''); setStatus(''); }}
            isLoading={isLoading}
          />
        }
        content={
          <ApplicationTable 
            applications={applications} 
            onRowClick={handleRowClick} 
          />
        }
      />
      <ApplicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </>
  );
};
