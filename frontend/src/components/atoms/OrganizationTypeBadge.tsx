import React from 'react';
import type { OrganizationType } from '../../types';

interface OrganizationTypeBadgeProps {
  type: OrganizationType;
  size?: 'xs' | 'sm';
}

const OrganizationTypeBadge: React.FC<OrganizationTypeBadgeProps> = ({ 
  type, 
  size = 'sm' 
}) => {
  const getColors = () => {
    switch (type) {
      case 'ESN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CABINET_RECRUTEMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STARTUP':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CLIENT_FINAL':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PME':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'GRAND_COMPTE':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'PORTAGE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'ESN': return 'ESN';
      case 'CABINET_RECRUTEMENT': return 'Cabinet';
      case 'STARTUP': return 'Startup';
      case 'CLIENT_FINAL': return 'Client final';
      case 'PME': return 'PME';
      case 'GRAND_COMPTE': return 'Grand compte';
      case 'PORTAGE': return 'Portage';
      default: return 'Autre';
    }
  };

  const sizeClass = size === 'xs' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span 
      className={`inline-flex items-center rounded border font-semibold ${getColors()} ${sizeClass} uppercase tracking-wider`}
    >
      {getLabel()}
    </span>
  );
};

export default OrganizationTypeBadge;
