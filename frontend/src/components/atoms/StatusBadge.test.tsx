import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'status.en_attente': 'En attente',
        'status.refusee': 'Refusée',
      };
      return translations[key] || key;
    },
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('StatusBadge', () => {
  it('renders translated status label', () => {
    render(<StatusBadge status="en_attente" />, { wrapper });
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('falls back to raw status if translation missing', () => {
    render(<StatusBadge status="unknown_status" />, { wrapper });
    expect(screen.getByText('unknown status')).toBeInTheDocument();
  });

  it('renders N/A for empty status', () => {
    render(<StatusBadge status="" />, { wrapper });
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
