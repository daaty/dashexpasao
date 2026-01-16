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
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 ${gradient ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950' : ''} ${noPadding ? '' : 'p-6'} ${className}`}>
      {title && (
        <div className={`flex justify-between items-center mb-6 ${noPadding ? 'p-6 pb-0' : ''}`}>
          <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          {tooltipText && <InfoTooltip text={tooltipText} />}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
