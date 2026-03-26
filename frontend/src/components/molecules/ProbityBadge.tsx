import React from 'react';
import type { ProbityLevel } from '../../types';

interface ProbityBadgeProps {
  score: number | null;
  level: ProbityLevel;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

export const ProbityBadge: React.FC<ProbityBadgeProps> = ({ 
  score, 
  level, 
  showScore = true, 
  size = 'sm' 
}) => {
  const getLevelClass = () => {
    switch (level) {
      case 'fiable': return 'is-fiable';
      case 'moyen': return 'is-moyen';
      case 'méfiance': return 'is-mefiance';
      default: return 'is-insuffisant';
    }
  };

  const getEmoji = () => {
    switch (level) {
      case 'fiable': return '🟢';
      case 'moyen': return '🟡';
      case 'méfiance': return '🔴';
      default: return '⚪';
    }
  };

  if (size === 'sm') {
    return (
      <span className={`probity-badge ${getLevelClass()} text-xs`}>
        {getEmoji()} {showScore && score !== null ? `${score}%` : level}
      </span>
    );
  }

  return (
    <div className={`probity-card p-4 rounded-md border border-light flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-secondary font-mono text-xs uppercase">Score de probité</span>
        <span className={`probity-badge ${getLevelClass()}`}>{getEmoji()} {level}</span>
      </div>
      {score !== null && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">{score}%</span>
          </div>
          <div className="w-full bg-ot-bg-base h-1 rounded-full overflow-hidden">
            <div 
              className={`h-full ${level === 'fiable' ? 'bg-green-500' : level === 'moyen' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
      {level === 'insuffisant' && (
        <p className="text-xs text-secondary italic">Données insuffisantes pour scoring</p>
      )}
    </div>
  );
};
