import React, { useEffect } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirm-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-modal">
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button 
            className="confirm-button cancel-button"
            onClick={onCancel}
          >
            취소
          </button>
          <button 
            className="confirm-button confirm-button-primary"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;