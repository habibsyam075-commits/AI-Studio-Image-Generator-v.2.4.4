
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
