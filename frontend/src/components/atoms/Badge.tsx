import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  isRounded?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'light',
  isRounded = false,
  className = '',
}) => {
  const variantClass = `is-${variant}`;
  const roundedClass = isRounded ? 'is-rounded' : '';
  
  return (
    <span className={`tag ${variantClass} ${roundedClass} ${className}`}>
      {children}
    </span>
  );
};
