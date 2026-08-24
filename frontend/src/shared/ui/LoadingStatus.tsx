import classes from './LoadingStatus.module.scss';

export function LoadingStatus({ children }: { children: string }) {
  return (
    <div className={classes.status} role="status" aria-live="polite">
      {children}
    </div>
  );
}
