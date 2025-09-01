import React, { useState } from 'react';
import { Category } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import ThreeDotsMenu from './ThreeDotsMenu';
import ConfirmModal from './ConfirmModal';
import './CategoryPanel.css';

interface CategoryPanelProps {
  className?: string;
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({ className = '' }) => {
  const { 
    categories, 
    uiState,
    selectCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    createFolder
  } = useDocuments();

  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#007bff');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, categoryId: string | null}>({isOpen: false, categoryId: null});
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const categoryId = await createCategory(newCategoryName, newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#007bff');
      setIsCreating(false);
      // 새로 생성한 카테고리를 자동으로 선택
      await selectCategory(categoryId);
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
    }
  };

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleEditSave = async () => {
    if (!editingName.trim() || !editingId) return;
    
    try {
      await updateCategory(editingId, { name: editingName });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    console.log('삭제 요청 카테고리:', { id: categoryId, name: category?.name });
    setDeleteModalState({isOpen: true, categoryId});
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.categoryId) return;
    
    try {
      console.log('UI에서 카테고리 삭제 시도:', deleteModalState.categoryId);
      await deleteCategory(deleteModalState.categoryId);
      console.log('UI에서 카테고리 삭제 성공');
      setDeleteModalState({isOpen: false, categoryId: null});
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert(`카테고리 삭제 실패: ${error}`);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalState({isOpen: false, categoryId: null});
  };

  const handleAddFolder = async (categoryId: string) => {
    const folderName = window.prompt('새 폴더 이름을 입력하세요:');
    if (folderName && folderName.trim()) {
      try {
        await createFolder(categoryId, folderName.trim());
      } catch (error) {
        console.error('폴더 생성 실패:', error);
      }
    }
  };

  // 드래그앤드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', category.id);
    
    // 드래그 시작할 때 반투명 효과
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedCategory(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    
    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      return;
    }

    try {
      // 드래그된 카테고리를 타겟 위치로 재정렬
      await reorderCategoriesToPosition(draggedCategory, targetCategory);
    } catch (error) {
      console.error('카테고리 재정렬 실패:', error);
    }
    
    setDraggedCategory(null);
  };

  const reorderCategoriesToPosition = async (draggedCategory: Category, targetCategory: Category) => {
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedCategories.findIndex(cat => cat.id === draggedCategory.id);
    const targetIndex = sortedCategories.findIndex(cat => cat.id === targetCategory.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // 새로운 순서 배열 생성
    const newOrder = [...sortedCategories];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    // 모든 카테고리의 order 값 업데이트
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order !== i) {
        await updateCategory(newOrder[i].id, { order: i });
      }
    }
  };

  const handleMenuToggle = (categoryId: string, isOpen: boolean) => {
    setOpenMenuId(isOpen ? categoryId : null);
  };

  // 롱프레스로 폴더 추가 (모바일용)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, categoryId: string) => {
    // 기존 타이머가 있으면 정리
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // 새 타이머 시작
    const timer = setTimeout(() => {
      handleAddFolder(categoryId);
      setLongPressTimer(null);
    }, 1200); // 1.2초
    
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const getMenuItems = (category: Category) => [
    {
      label: '폴더 추가',
      icon: '📁',
      onClick: () => handleAddFolder(category.id)
    },
    {
      label: '이름 변경',
      icon: '✏️',
      onClick: () => handleEditStart(category)
    },
    {
      label: '삭제',
      icon: '🗑️',
      onClick: () => handleDelete(category.id)
    }
  ];

  const predefinedColors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', 
    '#6f42c1', '#20c997', '#fd7e14', '#6c757d'
  ];

  return (
    <div className={`category-panel ${className}`}>
      <div className="panel-header">
        <h3>카테고리</h3>
        <button 
          className="add-button"
          onClick={() => setIsCreating(true)}
          title="카테고리 추가"
        >
          +
        </button>
      </div>

      <div className="category-list">
        {[...categories].sort((a, b) => a.order - b.order).map((category) => (
          <div
            key={category.id}
            className={`category-item ${uiState.selectedCategoryId === category.id ? 'selected' : ''} ${draggedCategory?.id === category.id ? 'dragging' : ''} ${openMenuId === category.id ? 'menu-open' : ''}`}
            onClick={async () => await selectCategory(category.id)}
            draggable={editingId !== category.id}
            onDragStart={(e) => handleDragStart(e, category)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category)}
            onTouchStart={(e) => editingId !== category.id && handleLongPressStart(e, category.id)}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={(e) => editingId !== category.id && handleLongPressStart(e, category.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
          >
            {editingId === category.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                  autoFocus
                  className="edit-input"
                />
                <div className="edit-buttons">
                  <button onClick={handleEditSave} className="save-btn">✓</button>
                  <button onClick={handleEditCancel} className="cancel-btn">✕</button>
                </div>
              </div>
            ) : (
              <>
                <div className="category-content">
                  <div 
                    className="category-color"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="category-name">{category.name}</span>
                </div>
                <ThreeDotsMenu 
                  menuItems={getMenuItems(category)} 
                  onToggle={(isOpen) => handleMenuToggle(category.id, isOpen)}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="create-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCategory();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewCategoryName('');
              }
            }}
            placeholder="카테고리 이름"
            className="create-input"
            autoFocus
          />
          <div className="color-picker">
            {predefinedColors.map((color) => (
              <button
                key={color}
                className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewCategoryColor(color)}
              />
            ))}
          </div>
          <div className="create-buttons">
            <button onClick={handleCreateCategory} className="create-btn">생성</button>
            <button 
              onClick={() => {
                setIsCreating(false);
                setNewCategoryName('');
                setNewCategoryColor('#007bff');
              }} 
              className="cancel-btn"
            >
              취소
            </button>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="카테고리 삭제"
        message="정말로 이 카테고리를 삭제하시겠습니까? 하위 폴더와 문서도 모두 삭제됩니다."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default CategoryPanel;