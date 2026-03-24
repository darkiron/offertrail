import React from 'react';
import type { OrganizationType } from '../../types';

interface OrganizationTypeBadgeProps {
  type: OrganizationType;
  size?: 'xs' | 'sm';
}

export const OrganizationTypeBadge: React.FC<OrganizationTypeBadgeProps> = ({ 
  type, 
  size = 'sm' 
}) => {
  const getStyle = () => {
    switch (type) {
      case 'CLIENT_FINAL': return { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'ESN': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'CABINET_RECRUTEMENT': return { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' };
      case 'STARTUP': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'PME': return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'GRAND_COMPTE': return { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'PORTAGE': return { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' };
      default: return { color: '#475569', bg: 'rgba(71, 85, 105, 0.1)' };
    }
  };

  const style = getStyle();
  const label = type.replace(/_/g, ' ');

  return (
    <span 
      className={`font-mono font-bold uppercase ${size === 'xs' ? 'text-[10px] px-1.5' : 'text-[11px] px-2'} py-0.5 rounded-sm`}
      style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.color}20` }}
    >
      {label}
    </span>
  );
};
