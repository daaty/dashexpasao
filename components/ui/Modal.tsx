import React from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{ 
          animation: 'scale-in 0.2s ease-out forwards',
          backgroundColor: 'rgb(15 35 60 / 95%)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex justify-between items-center p-4" style={{ borderBottom: '1px solid rgb(255 255 255 / 10%)' }}>
          <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>{title || 'Detalhes'}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full transition-colors"
            style={{ color: 'rgb(255 255 255 / 70%)', background: 'rgb(255 255 255 / 10%)' }}
            aria-label="Fechar modal"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ color: 'rgb(255 255 255 / 85%)' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
            animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;