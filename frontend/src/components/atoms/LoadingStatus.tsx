import classes from './LoadingStatus.module.css';

export function LoadingStatus({ children }: { children: string }) {
  return <div className={classes.status} role="status" aria-live="polite">{children}</div>;
}
