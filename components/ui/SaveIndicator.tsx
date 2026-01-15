import React, { useEffect, useState } from 'react';

interface SaveIndicatorProps {
  trigger: number; // Incrementar este valor para mostrar o indicador
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ trigger }) => {
  const [show, setShow] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (trigger > 0) {
      setShow(true);
      setLastSaved(new Date());
      
      const timer = setTimeout(() => {
        setShow(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!show && !lastSaved) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {show ? (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium">Salvando...</span>
        </div>
      ) : lastSaved ? (
        <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Salvo às {formatTime(lastSaved)}</span>
        </div>
      ) : null}
    </div>
  );
};
