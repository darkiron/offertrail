import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { ApiError, toApiError } from '../src/shared/api/ApiError';
import { parsePublicEnv } from '../src/shared/config/parsePublicEnv';

const validEnv = {
  VITE_API_URL: '',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'public-key',
};

describe('public environment configuration', () => {
  it('accepts the canonical same-origin API configuration', () => {
    const env = parsePublicEnv(validEnv);
    expect(env.apiUrl).toBe('');
    expect(env.contactEmail).toBe('contact@offertrail.fr');
  });

  it('fails fast and identifies invalid variables', () => {
    expect(() =>
      parsePublicEnv({ ...validEnv, VITE_SUPABASE_URL: 'not-a-url' }),
    ).toThrow(/VITE_SUPABASE_URL/);
  });
});

describe('ApiError', () => {
  it('normalizes HTTP failures without losing Axios compatibility', () => {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const response = {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
      data: { code: 'forbidden', detail: 'Access denied' },
    };
    const normalized = toApiError(
      new AxiosError(
        'Request failed',
        'ERR_BAD_RESPONSE',
        config,
        {},
        response,
      ),
    );

    expect(normalized).toBeInstanceOf(ApiError);
    expect(axios.isAxiosError(normalized)).toBe(true);
    expect(normalized).toMatchObject({
      status: 403,
      apiCode: 'forbidden',
      message: 'Access denied',
    });
  });
});
