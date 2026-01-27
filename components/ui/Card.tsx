import React from 'react';
import InfoTooltip from './InfoTooltip';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tooltipText?: string;
  noPadding?: boolean;
  gradient?: boolean;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, tooltipText, noPadding = false, gradient = false, style = {} }) => {
  return (
    <div 
      className={`dt-card rounded-xl transition-all duration-300 ${noPadding ? '' : 'p-6'} ${className}`}
      style={{
        backgroundColor: gradient ? 'rgb(255 255 255 / 8%)' : 'rgb(255 255 255 / 5%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgb(255 255 255 / 12%)',
        boxShadow: '0 .3rem .8rem rgba(0, 0, 0, .2)',
        borderRadius: '10px',
        background: gradient 
          ? `linear-gradient(135deg, rgba(12, 25, 41, 0.6) 0%, rgba(20, 45, 76, 0.6) 50%, rgba(26, 58, 92, 0.6) 100%), 
             linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08))`
          : undefined,
        ...style
      }}
    >
      {title && (
        <div className={`flex justify-between items-center mb-6 ${noPadding ? 'p-6 pb-0' : ''}`}>
          <h3 className="font-bold text-xl tracking-tight" style={{ color: '#ffffff' }}>{title}</h3>
          {tooltipText && <InfoTooltip text={tooltipText} />}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
