import type { Location } from 'react-router-dom';

type LoginState = { from?: unknown; message?: unknown } | null;

/** Return only an internal app path; never redirect to an arbitrary origin. */
export function getSafeLoginDestination(
  location: Pick<Location, 'state' | 'search'>,
): string {
  const state = location.state as LoginState;
  const params = new URLSearchParams(location.search);
  const candidate =
    typeof state?.from === 'string' ? state.from : params.get('next');

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//'))
    return '/app';
  try {
    const parsed = new URL(candidate, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/app';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/app';
  }
}

export function getLoginMessage(
  location: Pick<Location, 'state'>,
): string | null {
  const message = (location.state as LoginState)?.message;
  return typeof message === 'string' ? message : null;
}
