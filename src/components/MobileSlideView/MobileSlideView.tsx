import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import DocumentPanel from '../DocumentPanel';
import './MobileSlideView.css';

const MobileSlideView: React.FC = () => {
  const { 
    categories, 
    folders, 
    documents, 
    uiState, 
    selectCategory, 
    selectFolder, 
    selectDocument 
  } = useDocuments();

  const [currentView, setCurrentView] = useState<'categories' | 'folders' | 'documents' | 'document'>('categories');
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // UI 상태에 따라 현재 뷰 결정
  useEffect(() => {
    if (uiState.selectedDocumentId) {
      setCurrentView('document');
    } else if (uiState.selectedFolderId) {
      setCurrentView('documents');
    } else if (uiState.selectedCategoryId) {
      setCurrentView('folders');
    } else {
      setCurrentView('categories');
    }
  }, [uiState.selectedCategoryId, uiState.selectedFolderId, uiState.selectedDocumentId]);

  // 스와이프 제스처 처리
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) {
      const deltaX = Math.abs(e.touches[0].clientX - startXRef.current);
      const deltaY = Math.abs(e.touches[0].clientY - startYRef.current);
      if (deltaX > deltaY && deltaX > 10) {
        isDraggingRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.changedTouches[0].clientX - startXRef.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // 오른쪽으로 스와이프 - 뒤로가기
        handleBackNavigation();
      } else {
        // 왼쪽으로 스와이프 - 앞으로가기 (필요시 구현)
      }
    }
  };

  const handleBackNavigation = () => {
    if (currentView === 'document') {
      selectDocument(null);
    } else if (currentView === 'documents') {
      selectFolder(null);
    } else if (currentView === 'folders') {
      selectCategory(null);
    }
  };

  const renderCategoriesView = () => (
    <div className="mobile-slide-content">
      <div className="mobile-slide-header">
        <h2>카테고리</h2>
      </div>
      <div className="mobile-slide-list">
        {categories.map(category => (
          <div 
            key={category.id} 
            className="mobile-slide-item category-item"
            onClick={() => selectCategory(category.id)}
          >
            <div className="item-icon" style={{ backgroundColor: category.color }}>
              {category.name.charAt(0)}
            </div>
            <div className="item-content">
              <div className="item-title">{category.name}</div>
              <div className="item-subtitle">
                {folders.filter(f => f.categoryId === category.id).length}개 폴더
              </div>
            </div>
            <div className="item-arrow">›</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFoldersView = () => {
    const selectedCategory = categories.find(cat => cat.id === uiState.selectedCategoryId);
    const categoryFolders = folders.filter(folder => folder.categoryId === uiState.selectedCategoryId);

    return (
      <div className="mobile-slide-content">
        <div className="mobile-slide-header">
          <button className="back-button" onClick={() => selectCategory(null)}>
            ‹ 뒤로
          </button>
          <h2>{selectedCategory?.name}</h2>
        </div>
        <div className="mobile-slide-list">
          {categoryFolders.map(folder => (
            <div 
              key={folder.id} 
              className="mobile-slide-item folder-item"
              onClick={() => selectFolder(folder.id)}
            >
              <div className="item-icon">📁</div>
              <div className="item-content">
                <div className="item-title">{folder.name}</div>
                <div className="item-subtitle">
                  {documents.filter(d => d.folderId === folder.id).length}개 문서
                </div>
              </div>
              <div className="item-arrow">›</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentsView = () => {
    const selectedFolder = folders.find(folder => folder.id === uiState.selectedFolderId);
    const folderDocuments = documents.filter(doc => doc.folderId === uiState.selectedFolderId);

    return (
      <div className="mobile-slide-content">
        <div className="mobile-slide-header">
          <button className="back-button" onClick={() => selectFolder(null)}>
            ‹ 뒤로
          </button>
          <h2>{selectedFolder?.name}</h2>
        </div>
        <div className="mobile-slide-list">
          {folderDocuments.map(document => (
            <div 
              key={document.id} 
              className="mobile-slide-item document-item"
              onClick={() => selectDocument(document.id)}
            >
              <div className="item-icon">
                {document.isFavorite ? '⭐' : '📄'}
              </div>
              <div className="item-content">
                <div className="item-title">{document.title}</div>
                <div className="item-subtitle">
                  {new Date(document.updatedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className="item-arrow">›</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentView = () => (
    <div className="mobile-slide-content document-view">
      <div className="mobile-slide-header">
        <button className="back-button" onClick={() => selectDocument(null)}>
          ‹ 뒤로
        </button>
      </div>
      <div className="document-container">
        <DocumentPanel />
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'categories':
        return renderCategoriesView();
      case 'folders':
        return renderFoldersView();
      case 'documents':
        return renderDocumentsView();
      case 'document':
        return renderDocumentView();
      default:
        return renderCategoriesView();
    }
  };

  return (
    <div 
      className="mobile-slide-view"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Breadcrumb />
      {renderCurrentView()}
    </div>
  );
};

export default MobileSlideView;