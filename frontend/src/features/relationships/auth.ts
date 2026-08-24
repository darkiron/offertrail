import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { relationshipErrorStatus } from './locale';

const safeNext = (pathname: string, search: string) => {
  const next = `${pathname}${search}`;
  return next.startsWith('/app/') && !next.startsWith('//') ? next : '/app';
};

export function useRelationshipAuthRedirect(error?: unknown) {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectIfUnauthorized = useCallback(
    (caught: unknown) => {
      if (relationshipErrorStatus(caught) !== 401) return false;
      const next = safeNext(location.pathname, location.search);
      navigate(`/login?next=${encodeURIComponent(next)}`, {
        replace: true,
        state: { from: next },
      });
      return true;
    },
    [location.pathname, location.search, navigate],
  );

  useEffect(() => {
    if (error) redirectIfUnauthorized(error);
  }, [error, redirectIfUnauthorized]);

  return redirectIfUnauthorized;
}
