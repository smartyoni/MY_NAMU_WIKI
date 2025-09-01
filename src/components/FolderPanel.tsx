import React, { useState } from 'react';
import { Folder } from '../types';
import { useDocuments } from '../context/DocumentContextFirebase';
import ConfirmModal from './ConfirmModal';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';
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
    deleteDocument,
    reorderFolder,
    toggleFolder,
    createDocument,
    createFolder,
    getFoldersByCategory,
    getDocumentsByFolder,
    toggleFavorite
  } = useDocuments();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, folderId: string | null}>({isOpen: false, folderId: null});
  const { contextMenu, handleRightClick, closeContextMenu } = useContextMenu();
  
  // 드래그 앤 드롭 상태
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);

  const selectedFolders = uiState.selectedCategoryId 
    ? getFoldersByCategory(uiState.selectedCategoryId)
    : [];
    
  const selectedCategory = categories.find(c => c.id === uiState.selectedCategoryId);
  
  // 게시판 문서 가져오기
  const boardDocument = uiState.selectedCategoryId 
    ? documents.find(doc => doc.isBoardDocument && doc.categoryId === uiState.selectedCategoryId)
    : null;

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

  // 폴더 드래그 앤 드롭 핸들러들
  const handleFolderDragStart = (e: React.DragEvent, folder: Folder) => {
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', folder.id);
    
    // 드래그 시작할 때 반투명 효과
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleFolderDragEnd = (e: React.DragEvent) => {
    setDraggedFolder(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolder: Folder) => {
    e.preventDefault();
    
    if (!draggedFolder || draggedFolder.id === targetFolder.id) {
      return;
    }

    try {
      await reorderFoldersToPosition(draggedFolder, targetFolder);
    } catch (error) {
      console.error('폴더 재정렬 실패:', error);
    }
    
    setDraggedFolder(null);
  };

  const reorderFoldersToPosition = async (draggedFolder: Folder, targetFolder: Folder) => {
    const sortedFolders = [...selectedFolders].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedFolders.findIndex(folder => folder.id === draggedFolder.id);
    const targetIndex = sortedFolders.findIndex(folder => folder.id === targetFolder.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // 새로운 순서 배열 생성
    const newOrder = [...sortedFolders];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    // 새로운 order 값 할당 및 업데이트
    for (let i = 0; i < newOrder.length; i++) {
      const folder = newOrder[i];
      await updateFolder(folder.id, { order: i });
    }
  };


  // 폴더 컨텍스트 메뉴 항목 생성
  const getFolderContextMenuItems = (folder: Folder): ContextMenuItem[] => [
    {
      label: "폴더 이름 변경",
      icon: "✏️",
      onClick: () => handleEditStart(folder)
    },
    {
      label: "새 문서 추가",
      icon: "📄",
      onClick: () => handleAddDocument(folder.id)
    },
    { divider: true },
    {
      label: "폴더 삭제",
      icon: "🗑️",
      onClick: () => setDeleteModalState({isOpen: true, folderId: folder.id})
    }
  ];

  // 문서 컨텍스트 메뉴 항목 생성
  const getDocumentContextMenuItems = (documentId: string): ContextMenuItem[] => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return [];

    return [
      {
        label: "문서 편집",
        icon: "✏️",
        onClick: () => {
          selectDocument(documentId);
          // 편집 모드는 DocumentPanel에서 처리
        }
      },
      {
        label: "내용 복사",
        icon: "📋",
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(document.content);
            console.log('문서 내용이 클립보드에 복사되었습니다.');
          } catch (error) {
            console.error('복사 실패:', error);
          }
        }
      },
      {
        label: document.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
        icon: document.isFavorite ? "⭐" : "☆",
        onClick: async () => {
          try {
            await toggleFavorite(documentId);
          } catch (error) {
            console.error('즐겨찾기 토글 실패:', error);
          }
        }
      },
      { divider: true },
      {
        label: "문서 삭제",
        icon: "🗑️",
        onClick: async () => {
          if (window.confirm('이 문서를 삭제하시겠습니까?')) {
            try {
              await deleteDocument(documentId);
              console.log('문서가 삭제되었습니다.');
            } catch (error) {
              console.error('문서 삭제 실패:', error);
            }
          }
        }
      }
    ];
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
                      onContextMenu={(e) => handleRightClick(e, `folder-${folder.id}`)}
                      draggable
                      onDragStart={(e) => handleFolderDragStart(e, folder)}
                      onDragEnd={handleFolderDragEnd}
                      onDragOver={handleFolderDragOver}
                      onDrop={(e) => handleFolderDrop(e, folder)}
                    >
                      <div className="folder-content">
                        <div className="folder-title-line">
                          <span className={`folder-icon ${isExpanded ? 'expanded' : ''}`}>
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <span className="folder-name">{folder.name}</span>
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
                              onContextMenu={(e) => handleRightClick(e, `document-${document.id}`)}
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

      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.isVisible}
        onClose={closeContextMenu}
        items={(() => {
          if (!contextMenu.targetId) return [];
          
          if (contextMenu.targetId.startsWith('folder-')) {
            const folderId = contextMenu.targetId.replace('folder-', '');
            const folder = selectedFolders.find(f => f.id === folderId);
            return folder ? getFolderContextMenuItems(folder) : [];
          }
          
          if (contextMenu.targetId.startsWith('document-')) {
            const documentId = contextMenu.targetId.replace('document-', '');
            return getDocumentContextMenuItems(documentId);
          }
          
          return [];
        })()}
      />
    </div>
  );
};

export default FolderPanel;