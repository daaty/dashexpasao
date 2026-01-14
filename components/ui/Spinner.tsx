
import React from 'react';

interface SpinnerProps {
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = "w-6 h-6" }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
