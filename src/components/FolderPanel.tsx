import React, { useState } from 'react';
import { Folder } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import ThreeDotsMenu from './ThreeDotsMenu';
import './FolderPanel.css';

interface FolderPanelProps {
  className?: string;
}

const FolderPanel: React.FC<FolderPanelProps> = ({ className = '' }) => {
  const { 
    folders,
    uiState,
    selectFolder,
    selectDocument,
    updateFolder,
    deleteFolder,
    reorderFolder,
    toggleFolder,
    createDocument,
    getFoldersByCategory,
    getDocumentsByFolder
  } = useDocuments();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const selectedFolders = uiState.selectedCategoryId 
    ? getFoldersByCategory(uiState.selectedCategoryId)
    : [];

  const handleEditStart = (folder: Folder) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const handleEditSave = async () => {
    if (!editingName.trim() || !editingId) return;
    
    try {
      await updateFolder(editingId, { name: editingName });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('폴더 수정 실패:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (folderId: string) => {
    if (window.confirm('정말로 이 폴더를 삭제하시겠습니까? 하위 문서도 모두 삭제됩니다.')) {
      try {
        await deleteFolder(folderId);
      } catch (error) {
        console.error('폴더 삭제 실패:', error);
      }
    }
  };

  const handleAddDocument = async (folderId: string) => {
    const documentTitle = window.prompt('새 문서 제목을 입력하세요:');
    if (documentTitle && documentTitle.trim()) {
      try {
        const documentId = await createDocument(folderId, documentTitle.trim(), '');
        selectDocument(documentId);
      } catch (error) {
        console.error('문서 생성 실패:', error);
      }
    }
  };

  const handleFolderClick = (folder: Folder) => {
    selectFolder(folder.id);
    toggleFolder(folder.id);
  };

  const handleDocumentClick = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    selectDocument(documentId);
  };

  const getMenuItems = (folder: Folder) => [
    {
      label: '문서 추가',
      icon: '📄',
      onClick: () => handleAddDocument(folder.id)
    },
    {
      label: '이름 변경',
      icon: '✏️',
      onClick: () => handleEditStart(folder)
    },
    {
      label: '위로 이동',
      icon: '↑',
      onClick: () => reorderFolder(folder.id, 'up')
    },
    {
      label: '아래로 이동',
      icon: '↓',
      onClick: () => reorderFolder(folder.id, 'down')
    },
    {
      label: '삭제',
      icon: '🗑️',
      onClick: () => handleDelete(folder.id)
    }
  ];

  if (!uiState.selectedCategoryId) {
    return (
      <div className={`folder-panel ${className}`}>
        <div className="panel-header">
          <h3>폴더</h3>
        </div>
        <div className="empty-state">
          <p>카테고리를 선택하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`folder-panel ${className}`}>
      <div className="panel-header">
        <h3>폴더</h3>
      </div>

      <div className="folder-list">
        {selectedFolders.length === 0 ? (
          <div className="empty-state">
            <p>폴더가 없습니다</p>
            <small>카테고리의 3점 메뉴에서<br />폴더를 추가해보세요</small>
          </div>
        ) : (
          selectedFolders.map((folder) => {
            const folderDocuments = getDocumentsByFolder(folder.id);
            const isExpanded = uiState.expandedFolders.has(folder.id);
            const isSelected = uiState.selectedFolderId === folder.id;

            return (
              <div
                key={folder.id}
                className={`folder-item ${isSelected ? 'selected' : ''}`}
              >
                {editingId === folder.id ? (
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
                    <div 
                      className="folder-header"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <div className="folder-content">
                        <span className={`folder-icon ${isExpanded ? 'expanded' : ''}`}>
                          {isExpanded ? '📂' : '📁'}
                        </span>
                        <span className="folder-name">{folder.name}</span>
                        <span className="document-count">({folderDocuments.length})</span>
                      </div>
                      <ThreeDotsMenu 
                        menuItems={getMenuItems(folder)}
                        className="folder-menu"
                      />
                    </div>

                    {isExpanded && (
                      <div className="document-list">
                        {folderDocuments.length === 0 ? (
                          <div className="empty-documents">
                            <small>문서가 없습니다</small>
                          </div>
                        ) : (
                          folderDocuments.map((document) => (
                            <div
                              key={document.id}
                              className={`document-item ${uiState.selectedDocumentId === document.id ? 'selected' : ''}`}
                              onClick={(e) => handleDocumentClick(e, document.id)}
                            >
                              <span className="document-icon">📄</span>
                              <span className="document-title">{document.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FolderPanel;