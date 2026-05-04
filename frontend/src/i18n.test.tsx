import { renderHook, act } from '@testing-library/react';
import { useI18n, I18nProvider } from './i18n';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('useI18n hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  it('should return the current locale', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    // Default could be fr or en depending on navigator, but we can check it's a string
    expect(typeof result.current.locale).toBe('string');
  });

  it('should translate keys', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => {
      result.current.changeLanguage('fr');
    });
    expect(result.current.t('common.close')).toBe('Fermer');
    
    act(() => {
      result.current.changeLanguage('en');
    });
    expect(result.current.t('common.close')).toBe('Close');
  });

  it('should allow changing language', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    await act(async () => {
      await result.current.changeLanguage('fr');
    });
    expect(result.current.locale).toBe('fr');
    
    await act(async () => {
      await result.current.changeLanguage('en');
    });
    expect(result.current.locale).toBe('en');
  });
});
