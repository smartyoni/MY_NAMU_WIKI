import React from 'react';
import './FloatingButton.css';

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-button" onClick={onClick} title="빠른메모">
      <span className="floating-button-icon">⚡</span>
    </button>
  );
};

export default FloatingButton;