import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | 'success' | 'warning' | 'info';
  size?: 'small' | 'normal' | 'medium' | 'large';
  isLoading?: boolean;
  isFullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'normal',
  isLoading,
  isFullWidth,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = `is-${variant}`;
  const sizeClass = size !== 'normal' ? `is-${size}` : '';
  const loadingClass = isLoading ? 'is-loading' : '';
  const fullWidthClass = isFullWidth ? 'is-fullwidth' : '';
  
  return (
    <button
      className={`button ${variantClass} ${sizeClass} ${loadingClass} ${fullWidthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
};
