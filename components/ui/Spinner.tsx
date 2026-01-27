
import React from 'react';

interface SpinnerProps {
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = "w-6 h-6" }) => {
  return (
    <div 
      className={`animate-spin rounded-full border-4 ${className}`} 
      style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
