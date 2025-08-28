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
    documents,
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
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const selectedFolders = uiState.selectedCategoryId 
    ? getFoldersByCategory(uiState.selectedCategoryId)
    : [];
    
  const selectedCategory = categories.find(c => c.id === uiState.selectedCategoryId);
  
  // 게시판 문서 가져오기
  const boardDocument = uiState.selectedCategoryId 
    ? documents.find(doc => doc.isBoardDocument && doc.categoryId === uiState.selectedCategoryId)
    : null;
    
  console.log('FolderPanel - selectedCategoryId:', uiState.selectedCategoryId);
  console.log('FolderPanel - all documents:', documents.length);
  console.log('FolderPanel - board documents:', documents.filter(doc => doc.isBoardDocument));
  console.log('FolderPanel - boardDocument found:', boardDocument);

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
        {/* 게시판 문서 표시 */}
        {boardDocument && (
          <div className="board-document-item">
            <div 
              className="board-document-header"
              onClick={() => selectDocument(boardDocument.id)}
            >
              <div className="board-document-content">
                <div className="board-document-title-line">
                  <span className="board-document-icon">📋</span>
                  <span className="board-document-name">{boardDocument.title}</span>
                  <span className="board-document-badge">게시판</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      onMouseEnter={(e) => {
                        setHoveredFolder(folder.id);
                        setMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredFolder(null)}
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
                            className="folder-action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(folder);
                            }}
                            title="폴더명 편집"
                          >
                            ✏️
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

                    {/* 호버 미리보기 툴팁 */}
                    {hoveredFolder === folder.id && !isExpanded && (
                      <div 
                        className="folder-preview-tooltip"
                        style={{
                          left: mousePos.x + 15,
                          top: mousePos.y - 50
                        }}
                      >
                        <div className="tooltip-header">
                          📁 {folder.name} ({folderDocuments.length}개 문서)
                        </div>
                        <div className="tooltip-content">
                          {folderDocuments.length === 0 ? (
                            <div className="no-documents">문서가 없습니다</div>
                          ) : (
                            folderDocuments.slice(0, 5).map((document) => (
                              <div key={document.id} className="tooltip-document">
                                <span className="tooltip-doc-icon">📄</span>
                                <span className="tooltip-doc-title">{document.title}</span>
                                {document.isFavorite && <span className="tooltip-favorite">⭐</span>}
                              </div>
                            ))
                          )}
                          {folderDocuments.length > 5 && (
                            <div className="more-documents">
                              +{folderDocuments.length - 5}개 더...
                            </div>
                          )}
                        </div>
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