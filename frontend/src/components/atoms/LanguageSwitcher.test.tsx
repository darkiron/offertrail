import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MantineProvider } from '@mantine/core';

const mockChangeLanguage = vi.fn();

vi.mock('../../i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    locale: 'fr',
    changeLanguage: mockChangeLanguage,
  })),
}));

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/core')>();
  const MockMenu = ({ children }: any) => <div>{children}</div>;
  MockMenu.Target = ({ children }: any) => <div>{children}</div>;
  MockMenu.Dropdown = ({ children }: any) => <div>{children}</div>;
  MockMenu.Item = ({ children, onClick }: any) => (
    <button data-testid="menu-item" onClick={onClick}>{children}</button>
  );
  return { ...actual, Menu: MockMenu };
});

import { useI18n } from '../../i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('LanguageSwitcher', () => {
  it('shows French flag when locale is fr', () => {
    vi.mocked(useI18n).mockReturnValue({ t: (k) => k, locale: 'fr', changeLanguage: mockChangeLanguage } as any);
    render(<LanguageSwitcher />, { wrapper });
    expect(screen.getByText('🇫🇷')).toBeInTheDocument();
  });

  it('shows British flag when locale is en', () => {
    vi.mocked(useI18n).mockReturnValue({ t: (k) => k, locale: 'en', changeLanguage: mockChangeLanguage } as any);
    render(<LanguageSwitcher />, { wrapper });
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
  });

  it('calls changeLanguage("fr") when French option clicked', async () => {
    vi.mocked(useI18n).mockReturnValue({ t: (k) => k, locale: 'en', changeLanguage: mockChangeLanguage } as any);
    render(<LanguageSwitcher />, { wrapper });

    const frOption = screen.getByText('nav.langs.fr');
    await act(async () => { fireEvent.click(frOption); });
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('calls changeLanguage("en") when English option clicked', async () => {
    vi.mocked(useI18n).mockReturnValue({ t: (k) => k, locale: 'fr', changeLanguage: mockChangeLanguage } as any);
    render(<LanguageSwitcher />, { wrapper });

    const enOption = screen.getByText('nav.langs.en');
    await act(async () => { fireEvent.click(enOption); });
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });
});
