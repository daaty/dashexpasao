
import React from 'react';

interface LoadingIndicatorProps {
  status: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-100 dark:bg-dark-300">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-primary mb-2">Conectando ao IBGE...</h2>
        <p className="text-gray-900 font-bold animate-pulse">{status}</p>
        <p className="text-xs text-gray-700 font-medium mt-4">Obtendo dados reais de 141 municípios</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
