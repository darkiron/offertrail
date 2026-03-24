import React from 'react';
import { Card } from '../atoms/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  variant,
}) => {
  const textColor = variant ? `has-text-${variant}` : '';
  
  return (
    <Card className="metric-card">
      <div className="level is-mobile">
        <div className="level-left">
          <div>
            <p className="heading has-text-grey">{label}</p>
            <p className={`title is-3 ${textColor}`}>{value}</p>
          </div>
        </div>
        {icon && (
          <div className="level-right">
            <span className={`icon is-large ${textColor}`}>
              <i className={`fas fa-2x ${icon}`}></i>
            </span>
          </div>
        )}
      </div>
      {trend && (
        <p className="is-size-7 mt-2">
          <span className={trend.isPositive ? 'has-text-success' : 'has-text-danger'}>
            <i className={`fas ${trend.isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
            {Math.abs(trend.value)}%
          </span>
          <span className="has-text-grey ml-1">since last month</span>
        </p>
      )}
    </Card>
  );
};
