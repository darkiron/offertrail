import type { ReactNode } from 'react';
import classes from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  kicker?: string;
  count?: number | null;
  actions?: ReactNode;
  description?: string;
  variant?: 'compact' | 'editorial' | 'saas';
}

export function PageHeader({
  title,
  kicker,
  count,
  actions,
  description,
  variant = 'compact',
}: PageHeaderProps) {
  const Heading = variant === 'compact' ? 'h2' : 'h1';
  return (
    <header className={classes.header} data-variant={variant}>
      <div className={classes.row}>
        <div className={classes.intro}>
          {kicker && <span className={classes.kicker}>{kicker}</span>}
          <div className={classes.title}>
            <Heading>{title}</Heading>
            {count != null && <span className={classes.count}>{count}</span>}
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
      {description && <p className={classes.description}>{description}</p>}
    </header>
  );
}
