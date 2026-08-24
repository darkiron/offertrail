import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { ActionButton } from '../atoms/Action';
import { LoadingStatus } from '../atoms/LoadingStatus';
import {
  EntityList,
  EntityListRow,
  ResultHeader,
} from '../molecules/EntityList';
import { Pagination } from '../molecules/Pagination';
import { StatePanel } from '../molecules/StatePanel';

interface PageData<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
  per_page: number;
}

interface PortfolioListingProps<T> {
  label: string;
  headings: [string, string, string, string];
  data?: PageData<T>;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  summary: ReactNode;
  summaryAction?: ReactNode;
  loadingLabel: string;
  errorTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  getKey: (item: T) => string;
  onOpen: (item: T) => void;
  renderCells: (item: T) => ReactNode;
  onRetry: () => void;
  getPageHref: (page: number) => string;
  onPageChange?: (page: number) => void;
}

export function PortfolioListing<T>({
  label,
  headings,
  data,
  loading,
  fetching,
  error,
  summary,
  summaryAction,
  loadingLabel,
  errorTitle,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getKey,
  onOpen,
  renderCells,
  onRetry,
  getPageHref,
  onPageChange,
}: PortfolioListingProps<T>) {
  const { t } = useI18n();
  return (
    <>
      <ResultHeader action={summaryAction}>{summary}</ResultHeader>
      {fetching && data && (
        <LoadingStatus>
          {t('common.loadingPage').replace('{{page}}', String(data.page))}
        </LoadingStatus>
      )}
      {loading ? (
        <StatePanel>
          <LoadingStatus>{loadingLabel}</LoadingStatus>
        </StatePanel>
      ) : error ? (
        <StatePanel title={errorTitle}>
          <ActionButton onClick={onRetry}>{t('common.retry')}</ActionButton>
        </StatePanel>
      ) : !data?.items.length ? (
        <StatePanel title={emptyTitle} description={emptyDescription}>
          {emptyAction}
        </StatePanel>
      ) : (
        <>
          <EntityList label={label} headings={headings}>
            {data.items.map((item) => (
              <EntityListRow
                key={getKey(item)}
                busy={fetching}
                onOpen={() => onOpen(item)}
              >
                {renderCells(item)}
              </EntityListRow>
            ))}
          </EntityList>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            perPage={data.per_page}
            loading={fetching}
            getHref={getPageHref}
            onPageChange={onPageChange}
          />
        </>
      )}
    </>
  );
}
