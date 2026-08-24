import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

type ListingDefaults = Record<string, string>;

export function useListingController(basePath: string, defaults: ListingDefaults = {}) {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState({ value: query, sourceQuery: query });
  const search = draft.sourceQuery === query ? draft.value : query;
  const setSearch = (value: string) => setDraft({ value, sourceQuery: query });
  const page = Math.max(1, Number(params.get('page')) || 1);

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('q', search.trim());
      else next.delete('q');
      next.delete('page');
      setParams(next, { replace: true });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [params, query, search, setParams]);

  const value = (key: string) => params.get(key) ?? defaults[key] ?? '';
  const update = (key: string, nextValue: string) => {
    const next = new URLSearchParams(params);
    if (!nextValue || nextValue === defaults[key]) next.delete(key);
    else next.set(key, nextValue);
    next.delete('page');
    setParams(next);
  };
  const clear = () => {
    setSearch('');
    setParams({});
  };
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    return `${basePath}${next.size ? `?${next.toString()}` : ''}`;
  };

  return { params, page, query, search, setSearch, value, update, clear, pageHref };
}

export function usePaginatedListing<T>(queryKey: QueryKey, queryFn: () => Promise<T>) {
  return useQuery({ queryKey, queryFn, placeholderData: keepPreviousData });
}
