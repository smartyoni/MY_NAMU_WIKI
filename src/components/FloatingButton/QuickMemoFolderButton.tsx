import React from 'react';
import './QuickMemoFolderButton.css';

interface QuickMemoFolderButtonProps {
  onClick: () => void;
}

const QuickMemoFolderButton: React.FC<QuickMemoFolderButtonProps> = ({ onClick }) => {
  return (
    <button className="quick-memo-folder-button" onClick={onClick} title="빠른메모 폴더">
      <span className="quick-memo-folder-icon">📁</span>
    </button>
  );
};

export default QuickMemoFolderButton;