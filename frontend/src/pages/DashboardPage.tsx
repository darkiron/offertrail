import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardModel, mapDashboardDtoToModel } from '../domain/dashboard/model';
import { MetricsGrid } from '../components/organisms/MetricsGrid';
import { ApplicationTable } from '../components/organisms/ApplicationTable';
import { mapApplicationDtoToModel } from '../domain/application/model';

import { Button } from '../components/atoms/Button';
import { ApplicationModal } from '../components/organisms/ApplicationModal';

import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getDashboardData();
      setData(mapDashboardDtoToModel(response));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="section"><div className="container">Loading dashboard...</div></div>;
  }

  if (!data) {
    return <div className="section"><div className="container">No data available.</div></div>;
  }

  return (
    <div className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title">Dashboard</h1>
          </div>
          <div className="level-right">
            <Button onClick={() => setIsModalOpen(true)}>New Application</Button>
          </div>
        </div>
        
        <MetricsGrid metrics={{
          totalApps: data.totalApps,
          rejections: data.rejections,
          interviews: data.interviews,
          responseRate: data.responseRate,
        }} />

        <div className="columns mt-5">
          <div className="column is-12">
            <h2 className="subtitle">Follow-up Queue</h2>
            <ApplicationTable 
              applications={data.followups.map(mapApplicationDtoToModel)} 
              onRowClick={(id) => navigate(`/applications/${id}`)}
            />
          </div>
        </div>
        
        <ApplicationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchData} 
        />
      </div>
    </div>
  );
};
