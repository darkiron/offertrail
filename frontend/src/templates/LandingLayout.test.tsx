import { render, screen, act, fireEvent, within } from '@testing-library/react';
import { LandingLayout } from './LandingLayout';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { MantineProvider } from '@mantine/core';

import { useI18n } from '../i18n';

// Mocks
vi.mock('../i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    locale: 'fr',
    changeLanguage: vi.fn(),
  })),
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
    Drawer: ({ children, opened, onClose }: any) => (
      opened ? (
        <div role="dialog">
          <button aria-label="Close drawer" onClick={onClose}>Close</button>
          {children}
        </div>
      ) : null
    ),
    Burger: ({ opened, onClick }: any) => <button role="burger" onClick={onClick}>{opened ? 'Close' : 'Open'}</button>,
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

  it('toggles mobile menu and handles link clicks', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // In Mantine, Burger is a button.
    const burger = screen.getByRole('burger'); // MockBurger uses role burger
    
    // Click links in mobile menu
    const getDrawer = () => screen.queryByRole('dialog');
    
    // Feature link
    await act(async () => { fireEvent.click(burger); }); // Open
    await act(async () => { fireEvent.click(within(getDrawer()!).getByText('nav.features')); }); // Click & Close
    
    // Pricing link
    await act(async () => { fireEvent.click(burger); }); // Open
    await act(async () => { fireEvent.click(within(getDrawer()!).getByText('nav.pricing')); }); // Click & Close

    // Login link
    await act(async () => { fireEvent.click(burger); }); // Open
    await act(async () => { fireEvent.click(within(getDrawer()!).getByText('nav.login')); }); // Click & Close

    // Start link
    await act(async () => { fireEvent.click(burger); }); // Open
    await act(async () => { fireEvent.click(within(getDrawer()!).getByText('nav.start →')); }); // Click & Close

    // Test close button in drawer
    await act(async () => { fireEvent.click(burger); }); // Open
    const closeBtn = screen.getByLabelText('Close drawer');
    await act(async () => {
      fireEvent.click(closeBtn); // Click & Close
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles theme toggle in both desktop and mobile views', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    const themeButtons = screen.getAllByTitle('nav.switchTheme');
    expect(themeButtons.length).toBe(2); // Desktop and mobile

    for (const btn of themeButtons) {
      await act(async () => {
        fireEvent.click(btn);
      });
    }
  });

  it('handles language change in LandingLayout', async () => {
    const mockChangeLanguage = vi.fn();
    vi.mocked(useI18n).mockReturnValue({
      t: (k: string) => k,
      locale: 'fr',
      changeLanguage: mockChangeLanguage,
    } as any);

    await act(async () => {
      render(
        <MemoryRouter>
          <LandingLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });

    const enOptions = screen.getAllByText('nav.langs.en');
    await act(async () => {
      fireEvent.click(enOptions[0]);
    });
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');

    const frOptions = screen.getAllByText('nav.langs.fr');
    await act(async () => {
      fireEvent.click(frOptions[0]);
    });
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
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
