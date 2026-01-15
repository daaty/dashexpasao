import React from 'react';
import InfoTooltip from './InfoTooltip';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tooltipText?: string;
  noPadding?: boolean;
  gradient?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, tooltipText, noPadding = false, gradient = false }) => {
  return (
    <div className={`bg-white dark:bg-dark-200 rounded-2xl border border-slate-200/60 dark:border-dark-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm ${gradient ? 'bg-gradient-to-br from-white to-slate-50 dark:from-dark-200 dark:to-dark-300' : ''} ${noPadding ? '' : 'p-6'} ${className}`}>
      {title && (
        <div className={`flex justify-between items-center mb-6 ${noPadding ? 'p-6 pb-0' : ''}`}>
          <h3 className="font-bold text-xl text-black dark:text-white tracking-tight">{title}</h3>
          {tooltipText && <InfoTooltip text={tooltipText} />}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
