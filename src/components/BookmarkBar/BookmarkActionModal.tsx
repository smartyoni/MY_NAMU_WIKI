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
  console.log('BookmarkActionModal 렌더링:', { isOpen, bookmark: bookmark?.title, position });
  
  // 임시로 조건을 제거하여 강제 렌더링 테스트
  // if (!isOpen || !bookmark) {
  //   console.log('모달 숨김:', { isOpen, hasBookmark: !!bookmark });
  //   return null;
  // }
  
  // 임시 테스트용 데이터
  const testBookmark = bookmark || { title: 'Test Bookmark', url: 'http://test.com' };

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="bookmark-action-overlay" onClick={onCancel} />
      
      {/* 액션 메뉴 */}
      <div 
        className="bookmark-action-modal"
        style={{
          left: position.x,
          top: position.y,
          display: 'block',
          visibility: 'visible'
        }}
      >
        <div className="bookmark-action-header">
          <span className="bookmark-title">"{testBookmark.title}"</span>
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