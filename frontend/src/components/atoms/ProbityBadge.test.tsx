import { render, screen } from '@testing-library/react';
import { ProbityBadge } from './ProbityBadge';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'probity.fiable': 'Fiable',
        'probity.score': `Score: ${options?.score}/100`,
        'probity.weakSignal': 'Signal faible',
      };
      return translations[key] || key;
    },
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ProbityBadge', () => {
  it('renders reliable label and score', () => {
    render(<ProbityBadge level="fiable" score={85} />, { wrapper });
    expect(screen.getByText('Fiable')).toBeInTheDocument();
    expect(screen.getByText('(85)')).toBeInTheDocument();
  });

  it('renders weak signal label when score is null', () => {
    render(<ProbityBadge level="insuffisant" score={null} />, { wrapper });
    expect(screen.getByText('Signal faible')).toBeInTheDocument();
  });

  it('hides score when showScore is false', () => {
    render(<ProbityBadge level="fiable" score={85} showScore={false} />, { wrapper });
    expect(screen.queryByText('(85)')).not.toBeInTheDocument();
  });
});
