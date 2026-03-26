import React from 'react';
import type { OrganizationType } from '../../types';

interface OrganizationTypeBadgeProps {
  type: OrganizationType;
  size?: 'xs' | 'sm';
}

const organizationTypeConfig: Record<OrganizationType, { label: string; classes: string }> = {
  CLIENT_FINAL: { label: 'Client final', classes: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ESN: { label: 'ESN', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  CABINET_RECRUTEMENT: { label: 'Cabinet', classes: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
  STARTUP: { label: 'Startup', classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  PME: { label: 'PME', classes: 'bg-teal-100 text-teal-800 border-teal-200' },
  GRAND_COMPTE: { label: 'Grand compte', classes: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  PORTAGE: { label: 'Portage', classes: 'bg-rose-100 text-rose-800 border-rose-200' },
  AUTRE: { label: 'Autre', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const OrganizationTypeBadge: React.FC<OrganizationTypeBadgeProps> = ({ type, size = 'sm' }) => {
  const config = organizationTypeConfig[type] || organizationTypeConfig.AUTRE;
  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-[0.08em] uppercase ${config.classes} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
};

export default OrganizationTypeBadge;
