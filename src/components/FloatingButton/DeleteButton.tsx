import React from 'react';
import './DeleteButton.css';

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button 
      className={`delete-button ${disabled ? 'disabled' : ''}`} 
      onClick={onClick} 
      title="삭제"
      disabled={disabled}
    >
      <span className="delete-button-icon">🗑️</span>
    </button>
  );
};

export default DeleteButton;