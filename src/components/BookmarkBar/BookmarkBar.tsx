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
    reorderBookmark,
    reorderBookmarks
  } = useDocuments();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 액션 모달 상태
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

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

  // 색상표 표시 상태
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });

  // 랜덤 색상 선택
  const getRandomColor = () => {
    return randomColors[Math.floor(Math.random() * randomColors.length)];
  };

  // 기본 북마크 데이터
  const defaultBookmarks = [
    { title: '구글', url: 'https://www.google.com', color: '#4A90E2' },
    { title: '네이버', url: 'https://www.naver.com', color: '#32CD32' },
    { title: '유튜브', url: 'https://www.youtube.com', color: '#FF4757' },
    { title: '깃허브', url: 'https://github.com', color: '#95A5A6' },
    { title: '스택오버', url: 'https://stackoverflow.com', color: '#F39C12' },
  ];

  // Firebase에서 북마크가 로드되고 비어있을 때 기본 북마크 생성
  useEffect(() => {
    // 첫 로드 후 북마크가 없을 때만 기본 북마크 생성
    if (bookmarks.length === 0) {
      // 약간의 지연을 두어 Firebase 로딩 완료 후 확인
      const timer = setTimeout(() => {
        if (bookmarks.length === 0) {
          initializeDefaultBookmarks();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [bookmarks]);


  // DOM 방식 색상표
  useEffect(() => {
    if (showColorPicker && selectedBookmark) {
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.id = 'color-picker-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        z-index: 99998;
      `;
      
      // 색상표 모달 생성
      const colorPicker = document.createElement('div');
      colorPicker.id = 'color-picker-modal';
      colorPicker.style.cssText = `
        position: fixed;
        left: ${colorPickerPosition.x}px;
        top: ${colorPickerPosition.y}px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 99999;
        padding: 16px;
        font-family: inherit;
        min-width: 300px;
      `;
      
      colorPicker.innerHTML = `
        <div style="
          padding-bottom: 12px;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 16px;
        ">
          <h4 style="
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #495057;
            text-align: center;
          ">색상 선택하기</h4>
          <p style="
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #6c757d;
            text-align: center;
          ">"${selectedBookmark.title}" 북마크의 색상을 선택하세요</p>
        </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        ">
          ${rainbowColors.map(colorInfo => `
            <button 
              class="color-option" 
              data-color="${colorInfo.color}"
              style="
                width: 60px;
                height: 60px;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                background-color: ${colorInfo.color};
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
              "
              title="${colorInfo.name} - ${colorInfo.category}"
            >
              <span style="
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                font-weight: 500;
              ">${colorInfo.name}</span>
            </button>
          `).join('')}
        </div>
        <button id="cancel-color-btn" style="
          width: 100%;
          padding: 8px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #495057;
        ">취소</button>
      `;
      
      // 색상 선택 이벤트 리스너
      const colorButtons = colorPicker.querySelectorAll('.color-option');
      colorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const color = (e.target as HTMLElement).getAttribute('data-color');
          if (color) {
            handleColorSelect(color);
          }
        });
        
        // 호버 효과
        btn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.transform = 'scale(1.1)';
          (e.target as HTMLElement).style.borderColor = '#007bff';
          (e.target as HTMLElement).style.zIndex = '1';
        });
        
        btn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.transform = 'scale(1)';
          (e.target as HTMLElement).style.borderColor = '#dee2e6';
          (e.target as HTMLElement).style.zIndex = '0';
        });
      });
      
      // 취소 버튼
      const cancelBtn = colorPicker.querySelector('#cancel-color-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          setShowColorPicker(false);
          setSelectedBookmark(null);
        });
      }
      
      // 오버레이 클릭으로 닫기
      overlay.addEventListener('click', () => {
        setShowColorPicker(false);
        setSelectedBookmark(null);
      });
      
      document.body.appendChild(overlay);
      document.body.appendChild(colorPicker);
      
      return () => {
        const existingOverlay = document.getElementById('color-picker-overlay');
        const existingModal = document.getElementById('color-picker-modal');
        if (existingOverlay) document.body.removeChild(existingOverlay);
        if (existingModal) document.body.removeChild(existingModal);
      };
    }
  }, [showColorPicker, selectedBookmark, colorPickerPosition]);

  // DOM 방식 북마크 액션 모달
  useEffect(() => {
    if (showActionModal && selectedBookmark) {
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.id = 'bookmark-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        z-index: 98999;
      `;
      
      // 모달 생성
      const modal = document.createElement('div');
      modal.id = 'bookmark-action-modal';
      modal.style.cssText = `
        position: fixed;
        left: ${modalPosition.x}px;
        top: ${modalPosition.y}px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 99999;
        min-width: 160px;
        font-family: inherit;
      `;
      
      modal.innerHTML = `
        <div style="
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          border-radius: 8px 8px 0 0;
        ">
          <span style="
            font-size: 12px;
            font-weight: 500;
            color: #495057;
            display: block;
            text-align: center;
          ">"${selectedBookmark.title}"</span>
        </div>
        <div style="padding: 4px 0;">
          <button id="edit-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">✏️ 편집</button>
          <button id="color-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">🎨 색상 변경</button>
          <button id="delete-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">🗑️ 삭제</button>
          <button id="cancel-btn" style="
            background: none;
            border: none;
            padding: 8px 16px;
            text-align: left;
            font-size: 13px;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            transition: background-color 0.15s ease;
          ">❌ 취소</button>
        </div>
      `;
      
      // 이벤트 리스너 추가
      const editBtn = modal.querySelector('#edit-btn');
      const colorBtn = modal.querySelector('#color-btn');
      const deleteBtn = modal.querySelector('#delete-btn');
      const cancelBtn = modal.querySelector('#cancel-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', handleActionEdit);
        editBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#e3f2fd';
          (e.target as HTMLElement).style.color = '#1976d2';
        });
        editBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }

      if (colorBtn) {
        colorBtn.addEventListener('click', handleActionColorChange);
        colorBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#f3e5f5';
          (e.target as HTMLElement).style.color = '#7b1fa2';
        });
        colorBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }

      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', handleActionDelete);
        deleteBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#ffebee';
          (e.target as HTMLElement).style.color = '#d32f2f';
        });
        deleteBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', handleActionCancel);
        cancelBtn.addEventListener('mouseenter', (e) => {
          (e.target as HTMLElement).style.background = '#f5f5f5';
          (e.target as HTMLElement).style.color = '#666';
        });
        cancelBtn.addEventListener('mouseleave', (e) => {
          (e.target as HTMLElement).style.background = 'none';
          (e.target as HTMLElement).style.color = '#495057';
        });
      }
      
      // 오버레이 클릭으로 닫기
      overlay.addEventListener('click', handleActionCancel);
      
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      
      return () => {
        const existingOverlay = document.getElementById('bookmark-modal-overlay');
        const existingModal = document.getElementById('bookmark-action-modal');
        if (existingOverlay) document.body.removeChild(existingOverlay);
        if (existingModal) document.body.removeChild(existingModal);
      };
    }
  }, [showActionModal, selectedBookmark, modalPosition]);

  const initializeDefaultBookmarks = async () => {
    try {
      for (const bookmark of defaultBookmarks) {
        await createBookmark(bookmark.title, bookmark.url, bookmark.color);
      }
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
    e.preventDefault();
    e.stopPropagation();
    
    // 모달 위치 설정 (마우스 위치 기준)
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

  const handleActionColorChange = () => {
    // 색상표 위치 설정 (모달 옆에 표시)
    const x = Math.min(modalPosition.x + 200, window.innerWidth - 320);
    const y = Math.max(modalPosition.y - 50, 20);
    
    setColorPickerPosition({ x, y });
    setShowColorPicker(true);
    setShowActionModal(false);
  };

  const handleColorSelect = async (color: string) => {
    if (selectedBookmark) {
      console.log('색상 변경 시도:', selectedBookmark.id, color);
      try {
        await updateBookmark(selectedBookmark.id, { color });
        console.log('색상 변경 성공');
      } catch (error) {
        console.error('색상 변경 실패:', error);
      }
    }
    setShowColorPicker(false);
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

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
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
    
    try {
      // Firebase에 새로운 순서 업데이트
      await reorderBookmarks(reorderedBookmarks);
      console.log('북마크 순서 변경 성공');
    } catch (error) {
      console.error('북마크 순서 변경 실패:', error);
    }
    
    setDraggedBookmark(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`bookmark-bar ${className}`}>
      <div className="bookmark-list">
        {bookmarks.map((bookmark, index) => {
          return (
            <button
              key={bookmark.id}
              className={`bookmark-item ${draggedBookmark === bookmark.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              style={{ backgroundColor: bookmark.color || '#6f42c1' }}
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
          );
        })}
        
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