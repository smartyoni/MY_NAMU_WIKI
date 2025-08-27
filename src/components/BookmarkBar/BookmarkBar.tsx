import React, { useState, useEffect } from 'react';
import { Bookmark } from '../../types';
import './BookmarkBar.css';

interface BookmarkBarProps {
  className?: string;
}

const BookmarkBar: React.FC<BookmarkBarProps> = ({ className = '' }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  const defaultBookmarks: Omit<Bookmark, 'id'>[] = [
    { title: '구글', url: 'https://www.google.com', order: 1, isDefault: true, color: '#4285f4' },
    { title: '네이버', url: 'https://www.naver.com', order: 2, isDefault: true, color: '#4285f4' },
    { title: '유튜브', url: 'https://www.youtube.com', order: 3, isDefault: true, color: '#4285f4' },
    { title: '깃허브', url: 'https://github.com', order: 4, isDefault: true, color: '#4285f4' },
    { title: '스택오버', url: 'https://stackoverflow.com', order: 5, isDefault: true, color: '#4285f4' },
  ];

  // 초기 북마크 로드
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    } else {
      // 기본 북마크 설정
      const initialBookmarks: Bookmark[] = defaultBookmarks.map((bookmark, index) => ({
        ...bookmark,
        id: `default-${index}`,
      }));
      setBookmarks(initialBookmarks);
      saveBookmarks(initialBookmarks);
    }
  };

  const saveBookmarks = (bookmarksToSave: Bookmark[]) => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarksToSave));
  };

  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddBookmark = (title: string, url: string) => {
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      title: title.slice(0, 5), // 5글자 제한
      url: url.startsWith('http') ? url : `https://${url}`,
      order: bookmarks.length + 1,
      isDefault: false,
      color: getRandomColor(), // 랜덤 색상 적용
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
    setShowAddModal(false);
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setShowAddModal(true);
  };

  const handleUpdateBookmark = (title: string, url: string) => {
    if (!editingBookmark) return;

    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === editingBookmark.id
        ? {
            ...bookmark,
            title: title.slice(0, 5),
            url: url.startsWith('http') ? url : `https://${url}`,
          }
        : bookmark
    );

    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
    setShowAddModal(false);
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  const handleRightClick = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    
    if (bookmark.isDefault) {
      // 기본 북마크는 편집만 가능
      const shouldEdit = window.confirm(`"${bookmark.title}" 북마크를 편집하시겠습니까?`);
      if (shouldEdit) {
        handleEditBookmark(bookmark);
      }
    } else {
      // 사용자 북마크는 삭제 가능
      const shouldDelete = window.confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`);
      if (shouldDelete) {
        handleDeleteBookmark(bookmark.id);
      }
    }
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
    
    setBookmarks(reorderedBookmarks);
    saveBookmarks(reorderedBookmarks);
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
    </div>
  );
};

export default BookmarkBar;