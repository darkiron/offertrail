import { Link } from 'react-router-dom';
import classes from './Pagination.module.css';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  loading?: boolean;
  getHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
}

export function Pagination({ page, pages, total, perPage, loading = false, getHref, onPageChange }: PaginationProps) {
  if (total <= 0 || pages <= 1) return null;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter((value) => value === 1 || value === pages || Math.abs(value - page) <= 1);
  const activate = (value: number) => { if (!loading) onPageChange?.(value); };
  const pageControl = (value: number, label: string, position?: 'next') => {
    const enabled = value >= 1 && value <= pages && !loading;
    const className = enabled ? classes.control : classes.disabled;
    if (!enabled) return <span className={`${className} ${position === 'next' ? classes.next : ''}`} aria-disabled="true">{label}</span>;
    return getHref ? <Link className={`${className} ${position === 'next' ? classes.next : ''}`} to={getHref(value)} onClick={() => activate(value)}>{label}</Link> : <button className={`${className} ${position === 'next' ? classes.next : ''}`} type="button" onClick={() => activate(value)}>{label}</button>;
  };
  return <nav className={classes.pagination} aria-label="Pagination">
    <span className={classes.summary}>{first}–{last} sur {total}</span>
    <div className={classes.controls}>{pageControl(page - 1, '← Précédent')}<div className={classes.pages}>{visible.map((value, index) => <span className={classes.group} key={value}>{index > 0 && value - visible[index - 1] > 1 && <span className={classes.ellipsis}>…</span>}{loading ? <span className={classes.pending}>{value}</span> : getHref ? <Link className={value === page ? classes.current : classes.page} to={getHref(value)} aria-current={value === page ? 'page' : undefined} onClick={() => activate(value)}>{value}</Link> : <button className={value === page ? classes.current : classes.page} type="button" aria-current={value === page ? 'page' : undefined} onClick={() => activate(value)}>{value}</button>}</span>)}</div></div>
    {pageControl(page + 1, 'Suivant →', 'next')}
  </nav>;
}
