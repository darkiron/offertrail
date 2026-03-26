import React from 'react';

type Status = 'INTERESTED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | string;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { label: string; style: React.CSSProperties }> = {
  INTERESTED: {
    label: 'Interet',
    style: { backgroundColor: 'rgba(14, 165, 233, 0.18)', color: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.34)' },
  },
  APPLIED: {
    label: 'Postule',
    style: { backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.34)' },
  },
  INTERVIEW: {
    label: 'Entretien',
    style: { backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.34)' },
  },
  OFFER: {
    label: 'Offre',
    style: { backgroundColor: 'rgba(16, 185, 129, 0.18)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.34)' },
  },
  REJECTED: {
    label: 'Refus',
    style: { backgroundColor: 'rgba(244, 63, 94, 0.18)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.34)' },
  },
};

export const statusLabelMap: Record<string, string> = Object.keys(statusConfig).reduce((accumulator, key) => {
  accumulator[key] = statusConfig[key].label;
  return accumulator;
}, {} as Record<string, string>);

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  const key = String(status || '').toUpperCase();
  const config = statusConfig[key] || {
    label: key || 'N/A',
    style: { backgroundColor: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.34)' },
  };

  const sizeStyle = size === 'sm'
    ? { padding: '0.35rem 0.65rem', fontSize: '0.72rem' }
    : { padding: '0.5rem 0.8rem', fontSize: '0.82rem' };

  return (
    <span
      className={className || ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        borderStyle: 'solid',
        borderWidth: 1,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1,
        ...sizeStyle,
        ...config.style,
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
