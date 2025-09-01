import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../context/DocumentContextFirebase';
import ConfirmModal from './ConfirmModal';
import './DocumentPanel.css';

interface DocumentPanelProps {
  className?: string;
}


const DocumentPanel: React.FC<DocumentPanelProps> = ({ className = '' }) => {
  const { 
    uiState,
    updateDocument,
    deleteDocument,
    reorderDocument,
    getSelectedDocument,
    toggleFavorite
  } = useDocuments();

  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedDocument = getSelectedDocument();

  useEffect(() => {
    if (selectedDocument) {
      setContent(selectedDocument.content);
      setTitle(selectedDocument.title);
      
      // 빠른메모이고 내용이 비어있으면 편집모드로 시작
      const isQuickMemo = selectedDocument.title.startsWith('메모 ');
      const isEmpty = !selectedDocument.content || selectedDocument.content.trim() === '';
      
      if (isQuickMemo && isEmpty) {
        setIsEditMode(true);
      } else {
        setIsEditMode(false);
      }
    } else {
      setContent('');
      setTitle('');
      setIsEditMode(false);
    }
  }, [selectedDocument]);



  const handleSave = async () => {
    if (!selectedDocument) return;
    
    try {
      const updateData: any = {
        title: title.trim(),
        content: content
      };
      
      // 즐겨찾기 정보가 있다면 보존
      if (selectedDocument.isFavorite === true) {
        updateData.isFavorite = selectedDocument.isFavorite;
        if (selectedDocument.favoriteOrder !== undefined) {
          updateData.favoriteOrder = selectedDocument.favoriteOrder;
        }
      }
      
      await updateDocument(selectedDocument.id, updateData);
      setIsEditMode(false);
    } catch (error) {
      console.error('문서 저장 실패:', error);
    }
  };

  const handleCancel = () => {
    if (selectedDocument) {
      setContent(selectedDocument.content);
      setTitle(selectedDocument.title);
    }
    setIsEditMode(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDelete = () => {
    if (!selectedDocument) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      await deleteDocument(selectedDocument.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('문서 삭제 실패:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleTitleSave = async () => {
    if (!selectedDocument || !title.trim()) return;
    
    try {
      await updateDocument(selectedDocument.id, { title: title.trim() });
    } catch (error) {
      console.error('제목 수정 실패:', error);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleGoToBottom = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedDocument) return;
    
    try {
      await toggleFavorite(selectedDocument.id);
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
    }
  };


  const renderPlainText = (text: string) => {
    if (!text) return '내용이 없습니다.';
    
    return text.split('\n').map((line, index) => (
      <div key={index} className="text-line">
        {renderLineWithLinks(line)}
      </div>
    ));
  };

  const renderLineWithLinks = (line: string) => {
    if (!line) return '\u00A0';
    
    // URL 패턴 매칭
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(line)) !== null) {
      // URL 이전 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      
      // URL 링크 추가
      parts.push(
        <a 
          key={match.index}
          href={match[0]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="content-link"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          {match[0]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // 남은 텍스트 추가
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : line;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // 실시간 자동저장은 제거하고 사용자가 명시적으로 저장할 때만 저장
  };


  if (!selectedDocument) {
    return (
      <div className={`document-panel ${className}`}>
        <div className="empty-state">
          <div className="empty-content">
            <h2>📝 My Wiki</h2>
            <p>문서를 선택하거나 새로 만들어보세요.</p>
            <div className="help-text">
              <small>
                • 카테고리를 선택하여 폴더 목록을 확인하세요<br />
                • 폴더를 클릭하여 문서 목록을 확인하세요<br />
                • 3점 메뉴에서 새 폴더나 문서를 추가할 수 있습니다
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`document-panel ${className}`}>
      <div className="document-header">
        <div className="document-title-section">
          {isEditMode ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTitleSave();
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setTitle(selectedDocument.title);
                  e.currentTarget.blur();
                }
              }}
              className="title-input"
              placeholder="문서 제목"
            />
          ) : (
            <h1 className="document-title">📄 {selectedDocument.title}</h1>
          )}
        </div>
        
        <div className="document-actions">
          {isEditMode ? (
            <>
              <button 
                className="action-button cancel-button"
                onClick={handleCancel}
                title="취소"
              >
                ❌ 취소
              </button>
              <button 
                className="action-button copy-button"
                onClick={handleCopyContent}
                title="수정 중인 내용 복사"
              >
                📋 복사
              </button>
              <button 
                className="action-button save-button"
                onClick={handleSave}
                title="저장"
              >
                💾 저장
              </button>
              <div className="move-buttons">
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'up')}
                  title="위로 이동"
                >
                  ↑
                </button>
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'down')}
                  title="아래로 이동"
                >
                  ↓
                </button>
                <button 
                  className="action-button move-button"
                  onClick={handleGoToBottom}
                  title="문서 맨 아래로 이동"
                >
                  ⬇️
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                className="action-button edit-button"
                onClick={handleEdit}
                title="편집"
              >
                ✏️ 편집
              </button>
              <button 
                className="action-button copy-button"
                onClick={handleCopyContent}
                title="문서 내용 복사"
              >
                📋 복사
              </button>
              <button 
                className={`action-button favorite-button ${selectedDocument.isFavorite === true ? 'active' : ''}`}
                onClick={handleFavoriteToggle}
                title={selectedDocument.isFavorite === true ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {selectedDocument.isFavorite === true ? '⭐' : '☆'}
              </button>
              {!selectedDocument.isBoardDocument && (
                <button 
                  className="action-button delete-button"
                  onClick={handleDelete}
                  title="삭제"
                >
                  🗑️ 삭제
                </button>
              )}
              <div className="move-buttons">
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'up')}
                  title="위로 이동"
                >
                  ↑
                </button>
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'down')}
                  title="아래로 이동"
                >
                  ↓
                </button>
              </div>
            </>
          )}
        </div>
      </div>


      <div className="document-content">
        {isEditMode ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="content-editor"
            placeholder="문서 내용을 입력하세요..."
            autoFocus
          />
        ) : (
          <div 
            className="content-viewer"
            onDoubleClick={() => setIsEditMode(true)}
            style={{ cursor: 'pointer' }}
            title="더블클릭하여 편집"
          >
            {renderPlainText(content)}
          </div>
        )}
      </div>

      <div className="document-footer">
        <div className="document-info">
          <small>
            생성: {selectedDocument.createdAt.toLocaleDateString('ko-KR')} | 
            수정: {selectedDocument.lastModified.toLocaleDateString('ko-KR')} {selectedDocument.lastModified.toLocaleTimeString('ko-KR')}
          </small>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showDeleteModal}
        title="문서 삭제"
        message="정말로 이 문서를 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default DocumentPanel;