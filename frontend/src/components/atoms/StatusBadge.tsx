import { Badge } from '@mantine/core';
import { getStatutLabel } from '../../utils/statut';
import classes from './StatusBadge.module.css';

type Status = 'INTERESTED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | string;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  className?: string;
}

type StatusKey = 'brouillon' | 'envoyee' | 'en_attente' | 'relancee' | 'entretien' | 'test_technique'
  | 'offre_recue' | 'acceptee' | 'refusee' | 'ghosting' | 'abandonnee' | 'interested' | 'applied'
  | 'interview' | 'offer' | 'rejected';

const STATUS_CLASS_MAP: Partial<Record<string, string>> = {
  brouillon:      classes.neutral,
  abandonnee:     classes.neutral,
  envoyee:        classes.applied,
  en_attente:     classes.applied,
  relancee:       classes.applied,
  applied:        classes.applied,
  interested:     classes.applied,
  entretien:      classes.interview,
  test_technique: classes.interview,
  interview:      classes.interview,
  offre_recue:    classes.offer,
  acceptee:       classes.offer,
  offer:          classes.offer,
  refusee:        classes.rejected,
  ghosting:       classes.rejected,
  rejected:       classes.rejected,
};

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const key = String(status || '').toLowerCase();
  const label = getStatutLabel(key);
  const colorClass = STATUS_CLASS_MAP[key] ?? classes.neutral;

  return (
    <Badge
      size={size === 'sm' ? 'sm' : 'md'}
      radius="xl"
      className={`${classes.badge} ${colorClass} ${className ?? ''}`}
      variant="light"
    >
      {label}
    </Badge>
  );
}

export default StatusBadge;
