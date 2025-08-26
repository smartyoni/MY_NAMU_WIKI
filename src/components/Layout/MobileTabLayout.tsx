import React, { useState } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './MobileTabLayout.css';

interface MobileTabLayoutProps {
  categoryPanel: React.ReactNode;
  folderPanel: React.ReactNode;
  documentPanel: React.ReactNode;
}

type TabType = 'category' | 'folder' | 'document';

const MobileTabLayout: React.FC<MobileTabLayoutProps> = ({
  categoryPanel,
  folderPanel,
  documentPanel
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('category');
  const { uiState, categories, folders, documents } = useDocuments();

  // 선택된 항목에 따라 자동으로 다음 단계 탭으로 이동
  React.useEffect(() => {
    if (uiState.selectedDocumentId) {
      // 문서가 선택되면 문서 탭으로
      setActiveTab('document');
    } else if (uiState.selectedCategoryId) {
      // 카테고리가 선택되면 폴더 탭으로
      setActiveTab('folder');
    } else {
      // 아무것도 선택되지 않으면 카테고리 탭으로
      setActiveTab('category');
    }
  }, [uiState.selectedDocumentId, uiState.selectedFolderId, uiState.selectedCategoryId]);

  const selectedCategory = categories.find(c => c.id === uiState.selectedCategoryId);
  const selectedFolders = folders.filter(f => f.categoryId === uiState.selectedCategoryId);
  const selectedFolder = folders.find(f => f.id === uiState.selectedFolderId);
  const folderDocuments = documents.filter(d => d.folderId === uiState.selectedFolderId);

  const getBreadcrumb = () => {
    const parts = [];
    if (selectedCategory) parts.push(selectedCategory.name);
    if (selectedFolder) parts.push(selectedFolder.name);
    if (uiState.selectedDocumentId) {
      const doc = documents.find(d => d.id === uiState.selectedDocumentId);
      if (doc) parts.push(doc.title);
    }
    return parts.join(' > ');
  };

  const getTabInfo = (tab: TabType) => {
    switch (tab) {
      case 'category':
        return { 
          icon: '📁', 
          label: '카테고리', 
          count: categories.length,
          active: !!uiState.selectedCategoryId 
        };
      case 'folder':
        return { 
          icon: '📂', 
          label: '폴더', 
          count: selectedFolders.length,
          active: !!uiState.selectedFolderId 
        };
      case 'document':
        return { 
          icon: '📄', 
          label: '문서', 
          count: folderDocuments.length,
          active: !!uiState.selectedDocumentId 
        };
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'category':
        return categoryPanel;
      case 'folder':
        return folderPanel;
      case 'document':
        return documentPanel;
    }
  };

  return (
    <div className="mobile-tab-layout">
      {/* 브레드크럼 */}
      <div className="mobile-breadcrumb">
        <div className="breadcrumb-text">
          {getBreadcrumb() || '위키를 시작해보세요'}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mobile-tab-content">
        {renderTabContent()}
      </div>

      {/* 하단 탭바 */}
      <div className="mobile-tab-bar">
        {(['category', 'folder', 'document'] as TabType[]).map((tab) => {
          const info = getTabInfo(tab);
          const isActive = activeTab === tab;
          const hasSelection = info.active;

          return (
            <button
              key={tab}
              className={`tab-button ${isActive ? 'active' : ''} ${hasSelection ? 'has-selection' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <div className="tab-icon">{info.icon}</div>
              <div className="tab-label">{info.label}</div>
              {info.count > 0 && (
                <div className="tab-badge">{info.count}</div>
              )}
              {hasSelection && (
                <div className="tab-indicator"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabLayout;