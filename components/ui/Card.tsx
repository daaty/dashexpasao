import React from 'react';
import InfoTooltip from './InfoTooltip';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tooltipText?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, tooltipText }) => {
  return (
    <div className={`bg-base-100 dark:bg-dark-200 p-6 rounded-xl shadow-sm ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          {tooltipText && <InfoTooltip text={tooltipText} />}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
