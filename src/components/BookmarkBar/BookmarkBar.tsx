import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import { Bookmark } from '../../types';
import BookmarkActionModal from './BookmarkActionModal';
import './BookmarkBar.css';

interface BookmarkBarProps {
  className?: string;
}

const BookmarkBar: React.FC<BookmarkBarProps> = ({ className = '' }) => {
  const { 
    bookmarks, 
    createBookmark, 
    updateBookmark, 
    deleteBookmark, 
    reorderBookmark 
  } = useDocuments();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 액션 모달 상태
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // 랜덤 색상 배열
  const randomColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#3742fa', '#2f3542', '#57606f', '#a4b0be', '#747d8c'
  ];

  // 랜덤 색상 선택
  const getRandomColor = () => {
    return randomColors[Math.floor(Math.random() * randomColors.length)];
  };

  // 기본 북마크 데이터
  const defaultBookmarks = [
    { title: '구글', url: 'https://www.google.com', color: '#4285f4' },
    { title: '네이버', url: 'https://www.naver.com', color: '#00C73C' },
    { title: '유튜브', url: 'https://www.youtube.com', color: '#FF0000' },
    { title: '깃허브', url: 'https://github.com', color: '#181717' },
    { title: '스택오버', url: 'https://stackoverflow.com', color: '#F58025' },
  ];

  // Firebase에서 북마크가 로드되고 비어있을 때 기본 북마크 생성
  useEffect(() => {
    // 첫 로드 후 북마크가 없을 때만 기본 북마크 생성
    if (bookmarks.length === 0) {
      // 약간의 지연을 두어 Firebase 로딩 완료 후 확인
      const timer = setTimeout(() => {
        if (bookmarks.length === 0) {
          console.log('기본 북마크 생성 중...');
          initializeDefaultBookmarks();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [bookmarks]);

  const initializeDefaultBookmarks = async () => {
    try {
      console.log('기본 북마크 생성 시작:', defaultBookmarks.length, '개');
      
      for (const bookmark of defaultBookmarks) {
        await createBookmark(bookmark.title, bookmark.url, bookmark.color);
        console.log(`${bookmark.title} 북마크 생성 완료`);
      }
      
      console.log('모든 기본 북마크 생성 완료');
    } catch (error) {
      console.error('기본 북마크 생성 실패:', error);
    }
  };

  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddBookmark = async (title: string, url: string) => {
    try {
      const formattedTitle = title.slice(0, 5); // 5글자 제한
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const randomColor = getRandomColor();
      
      await createBookmark(formattedTitle, formattedUrl, randomColor);
      setShowAddModal(false);
    } catch (error) {
      console.error('북마크 추가 실패:', error);
    }
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setShowAddModal(true);
  };

  const handleUpdateBookmark = async (title: string, url: string) => {
    if (!editingBookmark) return;

    try {
      const updates = {
        title: title.slice(0, 5),
        url: url.startsWith('http') ? url : `https://${url}`,
      };
      
      await updateBookmark(editingBookmark.id, updates);
      setShowAddModal(false);
      setEditingBookmark(null);
    } catch (error) {
      console.error('북마크 수정 실패:', error);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
    } catch (error) {
      console.error('북마크 삭제 실패:', error);
    }
  };

  const handleRightClick = (e: React.MouseEvent, bookmark: Bookmark) => {
    console.log('우클릭 이벤트 발생:', bookmark.title);
    e.preventDefault();
    e.stopPropagation();
    
    // 모달 위치 설정 (마우스 위치 기준)
    const x = Math.min(e.clientX, window.innerWidth - 180); // 화면 밖으로 나가지 않도록
    const y = Math.min(e.clientY, window.innerHeight - 150);
    
    console.log('모달 위치:', { x, y });
    
    setModalPosition({ x, y });
    setSelectedBookmark(bookmark);
    setShowActionModal(true);
    
    console.log('액션 모달 상태 변경 후:', { showActionModal: true, bookmark: bookmark.title });
  };

  const handleActionEdit = () => {
    if (selectedBookmark) {
      handleEditBookmark(selectedBookmark);
    }
    setShowActionModal(false);
    setSelectedBookmark(null);
  };

  const handleActionDelete = async () => {
    if (selectedBookmark) {
      const shouldDelete = window.confirm(`정말로 "${selectedBookmark.title}" 북마크를 삭제하시겠습니까?`);
      if (shouldDelete) {
        await handleDeleteBookmark(selectedBookmark.id);
      }
    }
    setShowActionModal(false);
    setSelectedBookmark(null);
  };

  const handleActionCancel = () => {
    setShowActionModal(false);
    setSelectedBookmark(null);
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    setDraggedBookmark(bookmarkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBookmark(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedBookmark) return;
    
    const draggedIndex = bookmarks.findIndex(b => b.id === draggedBookmark);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const newBookmarks = [...bookmarks];
    const draggedItem = newBookmarks[draggedIndex];
    
    // 배열에서 드래그된 아이템 제거
    newBookmarks.splice(draggedIndex, 1);
    // 새 위치에 삽입
    newBookmarks.splice(targetIndex, 0, draggedItem);
    
    // order 재정렬
    const reorderedBookmarks = newBookmarks.map((bookmark, index) => ({
      ...bookmark,
      order: index + 1
    }));
    
    // TODO: Firebase 드래그앤드롭 순서 변경 구현 필요
    // 현재는 단순히 상태만 업데이트 (새로고침하면 원래 순서로 돌아감)
    setDraggedBookmark(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`bookmark-bar ${className}`}>
      <div className="bookmark-list">
        {bookmarks.map((bookmark, index) => (
          <button
            key={bookmark.id}
            className={`bookmark-item ${draggedBookmark === bookmark.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            style={{ backgroundColor: '#6f42c1' }}
            draggable
            onDragStart={(e) => handleDragStart(e, bookmark.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => handleBookmarkClick(bookmark.url)}
            onDoubleClick={() => handleEditBookmark(bookmark)}
            onContextMenu={(e) => handleRightClick(e, bookmark)}
            title={`${bookmark.title} - ${bookmark.url}`}
          >
            {bookmark.title}
          </button>
        ))}
        
        <button
          className="bookmark-add"
          onClick={() => {
            setEditingBookmark(null);
            setShowAddModal(true);
          }}
          title="북마크 추가"
        >
          +
        </button>
      </div>

      {showAddModal && (
        <BookmarkModal
          bookmark={editingBookmark}
          onSave={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
          onCancel={() => {
            setShowAddModal(false);
            setEditingBookmark(null);
          }}
        />
      )}
    </div>
  );
};

// 북마크 추가/편집 모달
interface BookmarkModalProps {
  bookmark?: Bookmark | null;
  onSave: (title: string, url: string) => void;
  onCancel: () => void;
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({ bookmark, onSave, onCancel }) => {
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && url.trim()) {
      onSave(title.trim(), url.trim());
    }
  };

  return (
    <div className="bookmark-modal-overlay">
      <div className="bookmark-modal">
        <h3>{bookmark ? '북마크 편집' : '북마크 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름 (5글자 이내)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 5))}
              placeholder="구글"
              maxLength={5}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.google.com"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>취소</button>
            <button type="submit">저장</button>
          </div>
        </form>
      </div>
      
      {/* 북마크 액션 모달 */}
      {console.log('BookmarkBar 렌더링 시 모달 상태:', { 
        showActionModal, 
        selectedBookmark: selectedBookmark?.title,
        modalPosition 
      })}
      <BookmarkActionModal
        isOpen={showActionModal}
        bookmark={selectedBookmark}
        onEdit={handleActionEdit}
        onDelete={handleActionDelete}
        onCancel={handleActionCancel}
        position={modalPosition}
      />
    </div>
  );
};

export default BookmarkBar;