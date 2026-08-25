import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'secondary';
type Size = 'small' | 'normal';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'normal', loading = false, disabled, children, ...props }: ButtonProps) {
  return <button {...props} className={`ot-button ${props.className ?? ''}`} data-variant={variant} data-size={size === 'small' ? 'small' : 'normal'} data-loading={loading} disabled={disabled || loading}>{loading ? '…' : children}</button>;
}
