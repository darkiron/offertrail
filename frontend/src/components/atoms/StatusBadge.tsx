import { Badge } from '@mantine/core';
import { STATUT_COLORS, type Statut } from '../../constants/statuts';
import { useI18n } from '../../i18n';
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
  const { t } = useI18n();
  const key = status as Statut;
  const label = t(`status.${key}`) !== `status.${key}` ? t(`status.${key}`) : (status ? status.replace(/_/g, ' ') : 'N/A');
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
