import { render, screen, act, fireEvent } from '@testing-library/react';
import { AppLayout } from './AppLayout';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { subscriptionService } from '../services/api';

// Mocks
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockChangeLanguage = vi.fn();
const mockToggleColorScheme = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    signOut: mockSignOut,
    user: { email: 'test@example.com' },
    profile: { prenom: 'Test', role: 'user' },
  }),
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'fr',
    changeLanguage: mockChangeLanguage,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useIsFetching: () => 0,
}));

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/core')>();
  const MockMenu = ({ children }: any) => <div>{children}</div>;
  MockMenu.Target = ({ children }: any) => <div>{children}</div>;
  MockMenu.Dropdown = ({ children }: any) => <div>{children}</div>;
  MockMenu.Item = ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>;
  MockMenu.Label = ({ children }: any) => <div>{children}</div>;
  MockMenu.Divider = () => <hr />;

  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: 'light',
      toggleColorScheme: mockToggleColorScheme,
    }),
    Menu: MockMenu,
  };
});

vi.mock('@mantine/hooks', () => ({
  useDisclosure: () => [false, { toggle: vi.fn(), close: vi.fn() }],
}));

vi.mock('../services/api', () => ({
  subscriptionService: {
    getMe: vi.fn().mockResolvedValue({ is_active: true }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand and navigation links', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    expect(screen.getByText('OfferTrail')).toBeInTheDocument();
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
  });

  it('shows the language flag and handles change', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    const flagBtn = screen.getByText('🇬🇧');
    expect(flagBtn).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(flagBtn);
    });
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('handles theme toggle', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    // The theme toggle title is "Changer le thème"
    const themeBtn = screen.getByTitle('Changer le thème');
    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(mockToggleColorScheme).toHaveBeenCalled();
  });

  it('handles logout', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    
    // Open user menu
    const userBtn = screen.getByText('Test');
    await act(async () => {
      fireEvent.click(userBtn);
    });
    
    const logoutBtn = screen.getByText('Se déconnecter');
    await act(async () => {
      fireEvent.click(logoutBtn);
    });
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('redirects to checkout if subscription is inactive', async () => {
    vi.mocked(subscriptionService.getMe).mockResolvedValueOnce({ is_active: false } as any);
    
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/app']}>
          <AppLayout />
        </MemoryRouter>,
        { wrapper }
      );
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/app/checkout', { replace: true });
  });
});
