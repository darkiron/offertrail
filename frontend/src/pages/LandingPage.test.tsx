import { render, screen, act } from '@testing-library/react';
import { LandingPage } from './LandingPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { MantineProvider } from '@mantine/core';

let mockIsAuthenticated = false;

// Mocks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'fr',
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section with translated title', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('landing.hero.title')).toBeInTheDocument();
    expect(screen.getByText('landing.hero.subtitle')).toBeInTheDocument();
  });

  it('renders features section', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('landing.features.kicker')).toBeInTheDocument();
  });

  it('renders pricing section', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('landing.pricing.kicker')).toBeInTheDocument();
  });

  it('redirects to /app if authenticated', async () => {
    mockIsAuthenticated = true;
    
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // With MemoryRouter and no Routes, we can't easily check redirect but we can check it doesn't render hero
    expect(screen.queryByText('landing.hero.title')).not.toBeInTheDocument();
    
    // Reset for other tests
    mockIsAuthenticated = false;
  });
});
