import React from 'react';
import { Badge } from '../atoms/Badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'APPLIED': return 'info';
      case 'INTERVIEW': return 'warning';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'danger';
      case 'FOLLOW_UP': return 'primary';
      case 'GHOSTING':
      case 'NO_RESPONSE': return 'light';
      default: return 'light';
    }
  };

  return (
    <Badge variant={getVariant(status)} isRounded>
      {status?.replace('_', ' ')}
    </Badge>
  );
};
