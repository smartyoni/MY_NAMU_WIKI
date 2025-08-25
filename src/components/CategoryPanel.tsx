import React, { useState } from 'react';
import { Category } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import ThreeDotsMenu from './ThreeDotsMenu';
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory(newCategoryName, newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#007bff');
      setIsCreating(false);
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

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까? 하위 폴더와 문서도 모두 삭제됩니다.')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('카테고리 삭제 실패:', error);
      }
    }
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
      label: '위로 이동',
      icon: '↑',
      onClick: () => reorderCategory(category.id, 'up')
    },
    {
      label: '아래로 이동',
      icon: '↓',
      onClick: () => reorderCategory(category.id, 'down')
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
        {categories.map((category) => (
          <div
            key={category.id}
            className={`category-item ${uiState.selectedCategoryId === category.id ? 'selected' : ''}`}
            onClick={() => selectCategory(category.id)}
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
                <ThreeDotsMenu menuItems={getMenuItems(category)} />
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
    </div>
  );
};

export default CategoryPanel;