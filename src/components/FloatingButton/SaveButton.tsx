import React from 'react';
import './SaveButton.css';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button 
      className={`save-button ${disabled ? 'disabled' : ''}`} 
      onClick={onClick} 
      title="저장"
      disabled={disabled}
    >
      <span className="save-button-icon">💾</span>
    </button>
  );
};

export default SaveButton;