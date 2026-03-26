import React, {type JSX} from 'react';

interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  subtitle?: boolean;
  className?: string;
}

export const Title: React.FC<TitleProps> = ({
  children, 
  level = 1, 
  subtitle = false, 
  className = '' 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const baseClass = subtitle ? 'subtitle' : 'title';
  const sizeClass = `is-${level}`;
  
  return (
    <Tag className={`${baseClass} ${sizeClass} ${className}`}>
      {children}
    </Tag>
  );
};


