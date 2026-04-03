import React from 'react';
import { getStatutLabel, getStatutStyle } from '../../utils/statut';

type Status = 'INTERESTED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | string;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  className?: string;
}

export const statusLabelMap: Record<string, string> = {
  INTERESTED: getStatutLabel('interested'),
  APPLIED: getStatutLabel('applied'),
  INTERVIEW: getStatutLabel('interview'),
  OFFER: getStatutLabel('offer'),
  REJECTED: getStatutLabel('rejected'),
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  const key = String(status || '').toLowerCase();
  const style = getStatutStyle(key);
  const label = getStatutLabel(key);

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
        letterSpacing: '0.04em',
        lineHeight: 1,
        ...sizeStyle,
        backgroundColor: style.background,
        color: style.color,
        borderColor: style.borderColor,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
