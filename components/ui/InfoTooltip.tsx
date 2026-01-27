import React from 'react';
import { FiInfo } from 'react-icons/fi';

interface InfoTooltipProps {
  text: string;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, className = '' }) => {
  return (
    <div className={`relative group ${className}`}>
      <FiInfo className="w-4 h-4 cursor-help" style={{ color: 'rgb(255 255 255 / 50%)' }} />
      <div 
        className="absolute bottom-full right-0 mb-2 w-64 p-3 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"
        style={{ 
          backgroundColor: '#1e1e1e', 
          color: 'rgb(255 255 255 / 85%)',
          border: '1px solid rgb(255 255 255 / 15%)'
        }}
      >
        {text}
        <div className="absolute top-full right-2 w-0 h-0 border-x-4 border-x-transparent border-t-4" style={{ borderTopColor: '#1e1e1e' }}></div>
      </div>
    </div>
  );
};
export default InfoTooltip;
