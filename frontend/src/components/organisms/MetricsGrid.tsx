import React from 'react';
import { MetricCard } from '../molecules/MetricCard';

interface Metrics {
  totalApps: number;
  rejections: number;
  interviews: number;
  responseRate: number;
  activeApps?: number;
}

interface MetricsGridProps {
  metrics: Metrics;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="columns is-multiline">
      <div className="column is-3">
        <MetricCard 
          label="Total Applications" 
          value={metrics.totalApps} 
          icon="fa-file-alt" 
          variant="primary"
        />
      </div>
      <div className="column is-3">
        <MetricCard 
          label="Response Rate" 
          value={`${metrics.responseRate}%`} 
          icon="fa-reply" 
          variant="info"
        />
      </div>
      <div className="column is-3">
        <MetricCard 
          label="Interviews" 
          value={metrics.interviews} 
          icon="fa-comments" 
          variant="warning"
        />
      </div>
      <div className="column is-3">
        <MetricCard 
          label="Rejections" 
          value={metrics.rejections} 
          icon="fa-times-circle" 
          variant="danger"
        />
      </div>
    </div>
  );
};
