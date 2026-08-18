import { IconFolderOpen } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Title } from './Title';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={`ot-empty-state ${className ?? ''}`}>
      <span className="ot-empty-state__icon">
        {icon ?? <IconFolderOpen size={32} />}
      </span>
      <Title level={4}>{title}</Title>
      {description && <p className="ot-subtitle">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
