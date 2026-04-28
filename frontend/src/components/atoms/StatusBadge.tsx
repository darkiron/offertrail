import { Badge } from '@mantine/core';
import { STATUT_LABELS, STATUT_COLORS, type Statut } from '../../constants/statuts';
import classes from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const CLASS_MAP: Record<Statut, string> = {
  en_attente:  classes.applied,
  envoyee:     classes.applied,
  entretien:   classes.interview,
  offre_recue: classes.offer,
  refusee:     classes.rejected,
};

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const key = status as Statut;
  const label = STATUT_LABELS[key] ?? (status ? status.replace(/_/g, ' ') : 'N/A');
  const colorClass = CLASS_MAP[key] ?? classes.neutral;

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
