import React from 'react';
import { Title } from './Title';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'fa-folder-open',
  action,
  className = '',
}) => {
  return (
    <div className={`section has-text-centered p-6 ${className}`}>
      <div className="mb-4">
        <span className="icon is-large has-text-grey-light">
          <i className={`fas ${icon} fa-3x`}></i>
        </span>
      </div>
      <Title level={4}>{title}</Title>
      {description && (
        <p className="subtitle is-6 has-text-grey mb-5">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
