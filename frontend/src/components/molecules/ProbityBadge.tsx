import React from 'react';
import type { ProbityLevel } from '../../types';

interface ProbityBadgeProps {
  score: number | null;
  level: ProbityLevel;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

const getLevelClass = (level: ProbityLevel) => {
  switch (level) {
    case 'fiable':
      return 'is-fiable';
    case 'moyen':
      return 'is-moyen';
    case 'méfiance':
    case 'insuffisant':
      return 'is-mefiance';
    default:
      return 'is-mefiance';
  }
};

const getLabel = (level: ProbityLevel) => {
  switch (level) {
    case 'fiable':
      return 'fiable';
    case 'moyen':
      return 'moyen';
    case 'méfiance':
      return 'méfiance';
    case 'insuffisant':
      return 'signal faible';
    default:
      return 'signal faible';
  }
};

const getEmoji = (level: ProbityLevel) => {
  switch (level) {
    case 'fiable':
      return '🟢';
    case 'moyen':
      return '🟡';
    case 'méfiance':
    case 'insuffisant':
      return '🔴';
    default:
      return '🔴';
  }
};

export const ProbityBadge: React.FC<ProbityBadgeProps> = ({
  score,
  level,
  showScore = true,
  size = 'sm',
}) => {
  if (size === 'sm') {
    return (
      <span className={`probity-badge ${getLevelClass(level)} text-xs`}>
        {getEmoji(level)} {showScore && score !== null ? `${Math.round(score)}%` : getLabel(level)}
      </span>
    );
  }

  return (
    <div className="probity-card p-4 rounded-md border border-light flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-secondary font-mono text-xs uppercase">Score de probite</span>
        <span className={`probity-badge ${getLevelClass(level)}`}>{getEmoji(level)} {getLabel(level)}</span>
      </div>
      {score !== null ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">{Math.round(score)}%</span>
          </div>
          <div className="w-full bg-ot-bg-base h-1 rounded-full overflow-hidden">
            <div
              className={`h-full ${level === 'fiable' ? 'bg-green-500' : level === 'moyen' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-secondary italic">Absence de score exploitable: a traiter comme signal faible.</p>
      )}
    </div>
  );
};

export default ProbityBadge;
