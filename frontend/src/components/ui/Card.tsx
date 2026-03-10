import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div 
    className={`card ${className}`}
    style={style}
  >
    <div className="card-content">
      {children}
    </div>
  </div>
);
