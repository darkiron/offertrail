import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  kicker?: string;
  count?: number | null;
  actions?: ReactNode;
  description?: string;
  variant?: 'compact' | 'editorial';
}

export function PageHeader({ title, kicker, count, actions, description, variant = 'compact' }: PageHeaderProps) {
  const Heading = variant === 'editorial' ? 'h1' : 'h2';
  return (
    <header className="ot-page-header" data-variant={variant}>
      <div className="ot-page-header__row">
        <div className="ot-page-header__intro">
          {kicker && (
            <span className="ot-kicker">{kicker}</span>
          )}
          <div className="ot-page-header__title"><Heading>{title}</Heading>{count != null && <span className="ot-count">{count}</span>}</div>
        </div>
        {actions && <div className="ot-page-header__actions">{actions}</div>}
      </div>
      {description && (
        <p className="ot-subtitle">{description}</p>
      )}
    </header>
  );
}
