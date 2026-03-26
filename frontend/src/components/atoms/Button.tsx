import React from 'react';

type Variant = 'primary' | 'ghost' | 'secondary';
type Size = 'small' | 'normal';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'normal', className, children, ...rest }) => {
  const base = 'inline-flex items-center justify-center rounded-sm font-semibold transition-colors';
  const sizes = size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  const variants: Record<Variant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-white border border-gray-700',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  };
  return (
    <button className={`${base} ${sizes} ${variants[variant]} ${className || ''}`} {...rest}>
      {children}
    </button>
  );
};

export default Button;
