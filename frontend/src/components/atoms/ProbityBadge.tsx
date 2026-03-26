import React from 'react';
import type { ProbityLevel } from '../../types';

interface ProbityBadgeProps {
  score: number | null;
  level: ProbityLevel;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

const ProbityBadge: React.FC<ProbityBadgeProps> = ({
  score,
  level,
  showScore = true,
  size = 'sm',
}) => {
  const normalizedLevel = level === 'insuffisant' ? 'insuffisant' : level;

  const getColors = () => {
    switch (normalizedLevel) {
      case 'fiable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moyen':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'méfiance':
      case 'insuffisant':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getLabel = () => {
    switch (normalizedLevel) {
      case 'fiable':
        return 'Fiable';
      case 'moyen':
        return 'Moyen';
      case 'méfiance':
        return 'Méfiance';
      case 'insuffisant':
        return 'Signal faible';
      default:
        return 'Signal faible';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getColors()} ${sizeClass}`}
      title={score !== null ? `Score: ${score.toFixed(1)}/100` : 'Signal faible'}
    >
      {getLabel()}
      {showScore && score !== null ? (
        <span className="ml-1 opacity-75">({score.toFixed(0)})</span>
      ) : null}
    </span>
  );
};

export default ProbityBadge;
