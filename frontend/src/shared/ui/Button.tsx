import type { ButtonHTMLAttributes, ReactNode } from 'react';
import classes from './Action.module.scss';

export type ButtonVariant =
  'primary' | 'secondary' | 'quiet' | 'danger' | 'ghost';
type Size = 'small' | 'normal';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'normal',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? classes.quiet : classes[variant];
  return (
    <button
      {...props}
      className={`${classes.action} ${variantClass} ${props.className ?? ''}`}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading ? '…' : children}
    </button>
  );
}
