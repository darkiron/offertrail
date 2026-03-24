import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  variant = 'primary',
  className = '' 
}) => {
  const sizeClass = size === 'small' ? 'is-small' : size === 'large' ? 'is-large' : '';
  const variantClass = variant ? `has-text-${variant}` : '';
  
  return (
    <div className={`loading-spinner ${sizeClass} ${variantClass} ${className}`}></div>
  );
};

export default Spinner;
