import { render, screen, act, fireEvent } from '@testing-library/react';
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
  const MockMenu = ({ children }: any) => <div>{children}</div>;
  MockMenu.Target = ({ children }: any) => <div>{children}</div>;
  MockMenu.Dropdown = ({ children }: any) => <div>{children}</div>;
  MockMenu.Item = ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>;
  
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: 'light',
      toggleColorScheme: vi.fn(),
    }),
    Menu: MockMenu,
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
    // Use getAllByText because nav.pricing is in both header and footer
    expect(screen.getAllByText('nav.pricing').length).toBeGreaterThan(0);
  });

  it('shows the current language flag', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // Locale is 'fr', should show 🇫🇷
    const flags = screen.getAllByText('🇫🇷');
    expect(flags.length).toBeGreaterThan(0);
  });

  it('toggles mobile menu', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // In Mantine, Burger is a button. We can find it by its class or just find the third button (lang, theme, burger)
    const buttons = screen.getAllByRole('button');
    const burger = buttons.find(b => b.className.includes('Burger')) || buttons[buttons.length - 1];
    
    await act(async () => {
      fireEvent.click(burger);
    });
    // Drawer title should be visible
    expect(screen.getAllByText(/OfferTrail/i).length).toBeGreaterThan(0);
  });

  it('renders footer links', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('nav.legalCgu')).toBeInTheDocument();
    expect(screen.getByText('nav.legalPrivacy')).toBeInTheDocument();
  });
});
