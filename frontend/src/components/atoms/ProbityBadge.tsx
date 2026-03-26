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
  size = 'sm' 
}) => {
  const getColors = () => {
    switch (level) {
      case 'fiable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moyen':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'méfiance':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'fiable': return 'Fiable';
      case 'moyen': return 'Moyen';
      case 'méfiance': return 'Méfiance';
      default: return 'Données insuffisantes';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${getColors()} ${sizeClass}`}
      title={score !== null ? `Score: ${score.toFixed(1)}/100` : undefined}
    >
      {getLabel()}
      {showScore && score !== null && (
        <span className="ml-1 opacity-75">({score.toFixed(0)})</span>
      )}
    </span>
  );
};

export default ProbityBadge;
