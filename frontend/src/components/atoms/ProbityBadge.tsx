import { Badge } from '@mantine/core';
import type { ProbityLevel } from '../../types';
import { useI18n } from '../../i18n';
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

export function ProbityBadge({ score, level, showScore = true, size = 'sm' }: ProbityBadgeProps) {
  const { t } = useI18n();
  const colorClass = LEVEL_CLASS_MAP[level] ?? classes.danger;
  const label = t(`probity.${level}`) !== `probity.${level}` ? t(`probity.${level}`) : t('probity.weakSignal');
  const title = score !== null ? t('probity.score', { score: score.toFixed(1) }) : t('probity.weakSignal');

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
