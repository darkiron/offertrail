import { render, screen, act } from '@testing-library/react';
import { LandingLayout } from './LandingLayout';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { MantineProvider } from '@mantine/core';

// Mocks
vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'fr',
    changeLanguage: vi.fn(),
  }),
}));

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/core')>();
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: 'light',
      toggleColorScheme: vi.fn(),
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('LandingLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders translated navigation links', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('nav.features')).toBeInTheDocument();
    expect(screen.getByText('nav.pricing')).toBeInTheDocument();
  });

  it('shows the language flag', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // Locale is 'fr', should show 🇬🇧 in navActions and navBurger
    const flags = screen.getAllByText('🇬🇧');
    expect(flags.length).toBeGreaterThan(0);
  });
});
