import { Badge } from '@mantine/core';
import type { ProbityLevel } from '../../types';
import classes from './ProbityBadge.module.css';

interface ProbityBadgeProps {
  score: number | null;
  level: ProbityLevel;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

const LEVEL_CLASS_MAP: Record<string, string> = {
  fiable:      classes.fiable,
  moyen:       classes.moyen,
  méfiance:    classes.danger,
  insuffisant: classes.danger,
};

const LEVEL_LABEL_MAP: Record<string, string> = {
  fiable:      'Fiable',
  moyen:       'Moyen',
  méfiance:    'Méfiance',
  insuffisant: 'Signal faible',
};

export function ProbityBadge({ score, level, showScore = true, size = 'sm' }: ProbityBadgeProps) {
  const colorClass = LEVEL_CLASS_MAP[level] ?? classes.danger;
  const label = LEVEL_LABEL_MAP[level] ?? 'Signal faible';
  const title = score !== null ? `Score: ${score.toFixed(1)}/100` : 'Signal faible';

  return (
    <Badge
      size={size === 'sm' ? 'sm' : 'md'}
      radius="xl"
      className={`${classes.badge} ${colorClass}`}
      variant="light"
      title={title}
    >
      {label}
      {showScore && score !== null && (
        <span className={classes.score}>({score.toFixed(0)})</span>
      )}
    </Badge>
  );
}

export default ProbityBadge;
