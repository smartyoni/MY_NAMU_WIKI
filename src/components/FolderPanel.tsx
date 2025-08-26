import React, { useState } from 'react';
import { Folder } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import ConfirmModal from './ConfirmModal';
import './FolderPanel.css';

interface FolderPanelProps {
  className?: string;
}

const FolderPanel: React.FC<FolderPanelProps> = ({ className = '' }) => {
  const { 
    folders,
    categories,
    uiState,
    selectFolder,
    selectDocument,
    updateFolder,
    deleteFolder,
    reorderFolder,
    toggleFolder,
    createDocument,
    createFolder,
    getFoldersByCategory,
    getDocumentsByFolder
  } = useDocuments();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, folderId: string | null}>({isOpen: false, folderId: null});

  const selectedFolders = uiState.selectedCategoryId 
    ? getFoldersByCategory(uiState.selectedCategoryId)
    : [];
    
  const selectedCategory = categories.find(c => c.id === uiState.selectedCategoryId);

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

  const handleDelete = (folderId: string) => {
    setDeleteModalState({isOpen: true, folderId});
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.folderId) return;
    
    try {
      await deleteFolder(deleteModalState.folderId);
      setDeleteModalState({isOpen: false, folderId: null});
    } catch (error) {
      console.error('폴더 삭제 실패:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalState({isOpen: false, folderId: null});
  };

  const handleAddFolder = async () => {
    if (!uiState.selectedCategoryId) return;
    
    const folderName = window.prompt('새 폴더 이름을 입력하세요:');
    if (folderName && folderName.trim()) {
      try {
        await createFolder(uiState.selectedCategoryId, folderName.trim());
      } catch (error) {
        console.error('폴더 생성 실패:', error);
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
        <h3>{selectedCategory ? `${selectedCategory.name} > 폴더` : '폴더'}</h3>
        <button 
          className="add-folder-button"
          onClick={handleAddFolder}
          title="폴더 추가"
        >
          +
        </button>
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
                        <div className="folder-title-line">
                          <span className={`folder-icon ${isExpanded ? 'expanded' : ''}`}>
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <span className="folder-name">{folder.name}</span>
                        </div>
                        <div className="folder-actions">
                          <button 
                            className="folder-action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddDocument(folder.id);
                            }}
                            title="문서 추가"
                          >
                            +
                          </button>
                          <button 
                            className="folder-action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderFolder(folder.id, 'up');
                            }}
                            title="위로 이동"
                          >
                            ▲
                          </button>
                          <button 
                            className="folder-action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderFolder(folder.id, 'down');
                            }}
                            title="아래로 이동"
                          >
                            ▼
                          </button>
                          <button 
                            className="folder-action-button folder-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(folder.id);
                            }}
                            title="폴더 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
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
                              <div className="document-main">
                                <span className="document-icon">📄</span>
                                <span className="document-title">{document.title}</span>
                                {document.isFavorite === true && <span className="favorite-star">⭐</span>}
                              </div>
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
      
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="폴더 삭제"
        message="정말로 이 폴더를 삭제하시겠습니까? 하위 문서도 모두 삭제됩니다."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default FolderPanel;