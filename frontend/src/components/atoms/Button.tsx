import React from 'react';

type Variant = 'primary' | 'ghost' | 'secondary';
type Size = 'small' | 'normal';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'normal', className, children, ...rest }) => {
  const sizeStyle = size === 'small'
    ? { padding: '0.45rem 0.7rem', fontSize: '0.78rem' }
    : { padding: '0.65rem 1rem', fontSize: '0.9rem' };
  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%))',
      color: '#fff',
      borderColor: 'transparent',
    },
    ghost: {
      background: 'color-mix(in srgb, var(--bg-base) 78%, var(--bg-mantle) 22%)',
      color: 'var(--text-main)',
      borderColor: 'color-mix(in srgb, var(--border) 82%, transparent 18%)',
    },
    secondary: {
      background: 'color-mix(in srgb, var(--bg-surface) 88%, var(--bg-mantle) 12%)',
      color: 'var(--text-main)',
      borderColor: 'color-mix(in srgb, var(--border) 82%, transparent 18%)',
    },
  };
  return (
    <button
      className={className || ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: 'solid',
        fontWeight: 700,
        lineHeight: 1.1,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.65 : 1,
        transition: 'transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
        ...sizeStyle,
        ...variants[variant],
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
