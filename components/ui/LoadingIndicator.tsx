
import React from 'react';

interface LoadingIndicatorProps {
  status: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ status }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg"
      style={{ backgroundColor: 'rgba(21, 19, 19, 0.95)' }}
    >
      <div className="flex flex-col items-center">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
          style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
        ></div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#3b82f6' }}>Conectando ao IBGE...</h2>
        <p className="font-bold animate-pulse" style={{ color: '#ffffff' }}>{status}</p>
        <p className="text-xs font-medium mt-4" style={{ color: 'rgb(255 255 255 / 50%)' }}>Obtendo dados reais de 141 municípios</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
