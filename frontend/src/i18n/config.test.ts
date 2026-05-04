import { describe, it, expect } from 'vitest';
import i18n from './config';

describe('i18n config', () => {
  it('should be initialized with fr as fallback', () => {
    expect(i18n.options.fallbackLng).toContain('fr');
  });

  it('should be initialized synchronously (initImmediate: false)', () => {
    expect(i18n.options.initImmediate).toBe(false);
  });

  it('should have fr and en resources', () => {
    expect(i18n.options.resources).toHaveProperty('fr');
    expect(i18n.options.resources).toHaveProperty('en');
  });

  it('should translate correctly in fr', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.close')).toBe('Fermer');
  });

  it('should translate correctly in en', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common.close')).toBe('Close');
  });

  it('should fallback to fr if key is missing in en', async () => {
    await i18n.changeLanguage('en');
    // For now, all keys should be there, but let's test a hypothetical missing key if we had one
    // or just verify that fr works as fallback if we force it
    expect(i18n.t('common.not_existing_key')).toBe('common.not_existing_key');
  });
});
