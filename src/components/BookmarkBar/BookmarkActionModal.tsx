import React from 'react';
import { Bookmark } from '../../types';
import './BookmarkActionModal.css';

interface BookmarkActionModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const BookmarkActionModal: React.FC<BookmarkActionModalProps> = ({
  isOpen,
  bookmark,
  onEdit,
  onDelete,
  onCancel,
  position
}) => {
  if (!isOpen || !bookmark) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="bookmark-action-overlay" onClick={onCancel} />
      
      {/* 액션 메뉴 */}
      <div 
        className="bookmark-action-modal"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="bookmark-action-header">
          <span className="bookmark-title">"{bookmark.title}"</span>
        </div>
        
        <div className="bookmark-action-buttons">
          <button 
            className="action-btn edit-btn"
            onClick={onEdit}
          >
            ✏️ 편집
          </button>
          
          <button 
            className="action-btn delete-btn"
            onClick={onDelete}
          >
            🗑️ 삭제
          </button>
          
          <button 
            className="action-btn cancel-btn"
            onClick={onCancel}
          >
            ❌ 취소
          </button>
        </div>
      </div>
    </>
  );
};

export default BookmarkActionModal;