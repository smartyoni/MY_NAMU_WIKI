import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContextFirebase';
import { SidebarBookmark } from '../types';
import BookmarkActionModal from './BookmarkBar/BookmarkActionModal';
import './SidebarBookmarks.css';

const SidebarBookmarks: React.FC = () => {
  const { 
    sidebarBookmarks, 
    createSidebarBookmark, 
    updateSidebarBookmark,
    deleteSidebarBookmark, 
    reorderSidebarBookmarks 
  } = useDocuments();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<SidebarBookmark | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<SidebarBookmark | null>(null);
  
  // 액션 모달 상태
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<SidebarBookmark | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
  // 색상표 표시 상태
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });

  // 무지개 색상표 (북마크 성격별)
  const rainbowColors = [
    { color: '#FF4757', name: '빨강', category: '중요/긴급' },
    { color: '#FF6348', name: '주황', category: '알림/경고' },
    { color: '#FFC048', name: '노랑', category: '즐겨찾기' },
    { color: '#32CD32', name: '초록', category: '학습/성장' },
    { color: '#00D8FF', name: '하늘', category: '일상/라이프' },
    { color: '#4A90E2', name: '파랑', category: '업무/비즈니스' },
    { color: '#8E44AD', name: '보라', category: '취미/오락' },
    { color: '#F39C12', name: '골드', category: '쇼핑/구매' },
    { color: '#95A5A6', name: '회색', category: '참고/도구' },
    { color: '#2ECC71', name: '민트', category: '건강/운동' },
    { color: '#E91E63', name: '핑크', category: '소셜/커뮤니티' },
    { color: '#9B59B6', name: '자주', category: '개발/기술' }
  ];

  const getRandomColor = () => {
    return rainbowColors[Math.floor(Math.random() * rainbowColors.length)].color;
  };

  const handleAddBookmark = async (title: string, url: string) => {
    try {
      const updates = {
        title: title.slice(0, 5),
        url: url.startsWith('http') ? url : `https://${url}`,
        color: getRandomColor()
      };
      
      await createSidebarBookmark(updates.title, updates.url, updates.color);
      setShowAddModal(false);
    } catch (error) {
      console.error('사이드바 북마크 추가 실패:', error);
    }
  };

  const handleEditBookmark = (bookmark: SidebarBookmark) => {
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
      
      await updateSidebarBookmark(editingBookmark.id, updates);
      setShowAddModal(false);
      setEditingBookmark(null);
    } catch (error) {
      console.error('사이드바 북마크 수정 실패:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 북마크를 삭제하시겠습니까?')) {
      try {
        await deleteSidebarBookmark(id);
      } catch (error) {
        console.error('사이드바 북마크 삭제 실패:', error);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, bookmark: SidebarBookmark) => {
    setDraggedBookmark(bookmark);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBookmark(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetBookmark: SidebarBookmark) => {
    e.preventDefault();
    
    if (!draggedBookmark || draggedBookmark.id === targetBookmark.id) {
      return;
    }

    const sortedBookmarks = [...sidebarBookmarks].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedBookmarks.findIndex(b => b.id === draggedBookmark.id);
    const targetIndex = sortedBookmarks.findIndex(b => b.id === targetBookmark.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...sortedBookmarks];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    try {
      await reorderSidebarBookmarks(newOrder);
    } catch (error) {
      console.error('사이드바 북마크 재정렬 실패:', error);
    }
  };

  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRightClick = (e: React.MouseEvent, bookmark: SidebarBookmark) => {
    e.preventDefault();
    e.stopPropagation();
    
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    
    setModalPosition({ x, y });
    setSelectedBookmark(bookmark);
    
    setTimeout(() => {
      setShowActionModal(true);
    }, 0);
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
        await deleteSidebarBookmark(selectedBookmark.id);
      }
    }
    setShowActionModal(false);
    setSelectedBookmark(null);
  };

  const handleActionCancel = () => {
    setShowActionModal(false);
    setSelectedBookmark(null);
  };

  const handleActionColor = () => {
    if (selectedBookmark) {
      const rect = document.querySelector('.sidebar-bookmarks')?.getBoundingClientRect();
      const x = rect ? rect.right + 10 : modalPosition.x + 180;
      const y = modalPosition.y;
      
      setColorPickerPosition({ x, y });
      setShowColorPicker(true);
    }
    setShowActionModal(false);
  };

  const handleColorSelect = async (color: string) => {
    if (selectedBookmark) {
      try {
        await updateSidebarBookmark(selectedBookmark.id, { color });
      } catch (error) {
        console.error('사이드바 북마크 색상 변경 실패:', error);
      }
    }
    setShowColorPicker(false);
    setSelectedBookmark(null);
  };

  return (
    <div className="sidebar-bookmarks">
      <div className="sidebar-bookmarks-header">
        <h3>북마크</h3>
        <button 
          className="add-sidebar-bookmark-btn"
          onClick={() => {
            setEditingBookmark(null);
            setShowAddModal(true);
          }}
          title="북마크 추가"
        >
          +
        </button>
      </div>


      <div className="sidebar-bookmarks-list">
        {sidebarBookmarks
          .sort((a, b) => a.order - b.order)
          .map((bookmark) => (
            <div
              key={bookmark.id}
              className="sidebar-bookmark-item"
              draggable
              onDragStart={(e) => handleDragStart(e, bookmark)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, bookmark)}
              style={{ backgroundColor: bookmark.color || '#6f42c1', borderColor: '#000000' }}
              onContextMenu={(e) => handleRightClick(e, bookmark)}
            >
              <div 
                className="sidebar-bookmark-content"
                onClick={() => handleBookmarkClick(bookmark.url)}
                onDoubleClick={() => handleEditBookmark(bookmark)}
                title={`${bookmark.title} - ${bookmark.url}`}
              >
                <div className="sidebar-bookmark-main">
                  <div className="sidebar-bookmark-title">{bookmark.title}</div>
                </div>
              </div>
            </div>
          ))}

        {sidebarBookmarks.length === 0 && (
          <div className="sidebar-empty-state">
            <p>북마크가 없습니다</p>
            <small>+ 버튼을 눌러 북마크를 추가해보세요</small>
          </div>
        )}
      </div>

      {/* 액션 모달 */}
      <SidebarBookmarkActionModal
        isOpen={showActionModal}
        bookmark={selectedBookmark}
        onEdit={handleActionEdit}
        onColor={handleActionColor}
        onDelete={handleActionDelete}
        onCancel={handleActionCancel}
        position={modalPosition}
      />

      {/* 색상 선택 모달 */}
      <SidebarColorPicker
        isOpen={showColorPicker}
        bookmark={selectedBookmark}
        onColorSelect={handleColorSelect}
        onCancel={() => {
          setShowColorPicker(false);
          setSelectedBookmark(null);
        }}
        position={colorPickerPosition}
        rainbowColors={rainbowColors}
      />

      {/* 추가/편집 모달 */}
      {showAddModal && (
        <SidebarBookmarkModal
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

// 사이드바 북마크 액션 모달
interface SidebarBookmarkActionModalProps {
  isOpen: boolean;
  bookmark: SidebarBookmark | null;
  onEdit: () => void;
  onColor: () => void;
  onDelete: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const SidebarBookmarkActionModal: React.FC<SidebarBookmarkActionModalProps> = ({
  isOpen,
  bookmark,
  onEdit,
  onColor,
  onDelete,
  onCancel,
  position
}) => {
  if (!isOpen || !bookmark) return null;

  return (
    <>
      <div className="bookmark-action-overlay" onClick={onCancel} />
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
            className="action-btn color-btn"
            onClick={onColor}
          >
            🎨 색상 변경
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

// 사이드바 색상 선택 모달
interface SidebarColorPickerProps {
  isOpen: boolean;
  bookmark: SidebarBookmark | null;
  onColorSelect: (color: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
  rainbowColors: Array<{ color: string; name: string; category: string }>;
}

const SidebarColorPicker: React.FC<SidebarColorPickerProps> = ({
  isOpen,
  bookmark,
  onColorSelect,
  onCancel,
  position,
  rainbowColors
}) => {
  if (!isOpen || !bookmark) return null;

  return (
    <>
      <div className="color-picker-overlay" onClick={onCancel} />
      <div 
        className="color-picker-modal"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="color-picker-header">
          <h4>색상 선택하기</h4>
          <p>"{bookmark.title}" 북마크의 색상을 선택하세요</p>
        </div>
        <div className="color-grid">
          {rainbowColors.map((colorInfo) => (
            <button
              key={colorInfo.color}
              className="color-option"
              style={{ backgroundColor: colorInfo.color }}
              onClick={() => onColorSelect(colorInfo.color)}
              title={`${colorInfo.name} - ${colorInfo.category}`}
            >
              <div className="color-info">
                <div className="color-name">{colorInfo.name}</div>
                <div className="color-category">{colorInfo.category}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="color-cancel-btn" onClick={onCancel}>취소</button>
      </div>
    </>
  );
};

// 사이드바 북마크 추가/편집 모달
interface SidebarBookmarkModalProps {
  bookmark?: SidebarBookmark | null;
  onSave: (title: string, url: string) => void;
  onCancel: () => void;
}

const SidebarBookmarkModal: React.FC<SidebarBookmarkModalProps> = ({ bookmark, onSave, onCancel }) => {
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
              placeholder="북마크 이름"
              maxLength={5}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="save-btn">
              {bookmark ? '수정' : '추가'}
            </button>
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SidebarBookmarks;