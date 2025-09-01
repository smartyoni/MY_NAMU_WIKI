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
    toggleFavorite,
    getRecentDocuments,
    selectDocument,
    selectCategory,
    selectFolder
  } = useDocuments();

  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedDocument = getSelectedDocument();

  useEffect(() => {
    if (selectedDocument) {
      setContent(selectedDocument.content);
      setTitle(selectedDocument.title);
      
      // 문서에 섹션이 있으면 모든 섹션을 접힌 상태로 초기화
      const sectionMatches = selectedDocument.content.match(/^\s*\[📁\s*(.+?)\]\s*$/gm);
      if (sectionMatches && sectionMatches.length > 0) {
        // 모든 섹션을 접힌 상태로 설정
        const allSections = new Set<string>();
        sectionMatches.forEach((_, index) => {
          const lines = selectedDocument.content.split('\n');
          lines.forEach((line, lineIndex) => {
            if (line.match(/^\s*\[📁\s*(.+?)\]\s*$/)) {
              allSections.add(`section-${lineIndex}`);
            }
          });
        });
        setCollapsedSections(allSections);
      } else {
        // 섹션이 없으면 빈 Set으로 초기화
        setCollapsedSections(new Set());
      }
      
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
      setCollapsedSections(new Set());
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

  const handleRecentDocumentClick = async (documentHistory: any) => {
    try {
      await selectCategory(documentHistory.categoryId);
      selectFolder(documentHistory.folderId);
      selectDocument(documentHistory.documentId);
      setShowRecentDropdown(false);
    } catch (error) {
      console.error('최근 문서 선택 실패:', error);
    }
  };


  const renderPlainText = (text: string) => {
    if (!text) return '내용이 없습니다.';
    
    const lines = text.split('\n');
    const result: JSX.Element[] = [];
    let currentSectionId: string | null = null;
    let sectionContent: string[] = [];
    let sectionTitle = '';
    
    const flushSection = (lineIndex: number) => {
      if (currentSectionId && sectionTitle) {
        const isCollapsed = collapsedSections.has(currentSectionId);
        const sectionIdForCallback = currentSectionId; // 클로저 문제 방지
        
        result.push(
          <div key={`section-${currentSectionId}`} className="collapsible-section">
            <div 
              className="section-header"
              onClick={() => toggleSection(sectionIdForCallback)}
              style={{ 
                cursor: 'pointer', 
                padding: '8px 12px', 
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                margin: '8px 0'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '14px' }}>
                {isCollapsed ? '📁' : '📂'}
              </span>
              <strong>{sectionTitle}</strong>
            </div>
            {!isCollapsed && sectionContent.length > 0 && (
              <div className="section-content" style={{ marginLeft: '20px', marginBottom: '16px' }}>
                {sectionContent.map((contentLine, idx) => (
                  <div key={`content-${currentSectionId}-${idx}`} className="text-line">
                    {renderLineWithLinks(contentLine)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      currentSectionId = null;
      sectionContent = [];
      sectionTitle = '';
    };
    
    lines.forEach((line, index) => {
      // [📁 제목] 패턴 감지
      const sectionMatch = line.match(/^\s*\[📁\s*(.+?)\]\s*$/);
      
      // 구분선 패턴 감지 (━, ▬, ◆◇, ═, ⋯ 등)
      const dividerMatch = line.match(/^\s*(━+|▬+|[◆◇]+|═+|⋯+)\s*$/);
      
      if (sectionMatch) {
        // 이전 섹션 마무리
        flushSection(index);
        
        // 새 섹션 시작
        currentSectionId = `section-${index}`;
        sectionTitle = sectionMatch[1].trim();
      } else if (dividerMatch && currentSectionId) {
        // 구분선을 만나면 현재 섹션을 종료하고 구분선을 일반 텍스트로 처리
        flushSection(index);
        
        // 구분선을 일반 텍스트로 추가 (볼드 처리)
        result.push(
          <div key={index} className="text-line" style={{ fontWeight: 'bold' }}>
            {renderLineWithLinks(line)}
          </div>
        );
      } else if (currentSectionId) {
        // 현재 섹션의 내용
        if (line.trim() !== '') {
          sectionContent.push(line);
        }
      } else {
        // 일반 텍스트 라인 (볼드 처리)
        result.push(
          <div key={index} className="text-line" style={{ fontWeight: 'bold' }}>
            {renderLineWithLinks(line)}
          </div>
        );
      }
    });
    
    // 마지막 섹션 처리
    flushSection(lines.length);
    
    return result;
  };
  
  const toggleSection = (sectionId: string) => {
    console.log('toggleSection 호출:', sectionId);
    console.log('현재 collapsedSections:', collapsedSections);
    
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        console.log('섹션 펼치기:', sectionId);
        newSet.delete(sectionId);
      } else {
        console.log('섹션 접기:', sectionId);
        newSet.add(sectionId);
      }
      console.log('새로운 collapsedSections:', newSet);
      return newSet;
    });
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
  
  const insertCollapsibleSection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    const template = '\n[📁 새 섹션]\n여기에 내용을 입력하세요...\n\n';
    
    const newContent = 
      content.substring(0, startPos) + 
      template + 
      content.substring(endPos);
    
    setContent(newContent);
    
    // 커서를 "새 섹션" 텍스트로 이동하여 바로 수정할 수 있도록 함
    setTimeout(() => {
      const titleStart = startPos + template.indexOf('새 섹션');
      textarea.focus();
      textarea.setSelectionRange(titleStart, titleStart + '새 섹션'.length);
      // 현재 커서 위치 근처로 스크롤 유지
      const lineHeight = 20; // 대략적인 줄 높이
      const cursorLine = newContent.substring(0, titleStart).split('\n').length;
      const scrollTop = Math.max(0, (cursorLine - 10) * lineHeight);
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  const insertDivider = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    // 선명한 구분선 - 여러 스타일 중 랜덤 선택
    const dividers = [
      '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
      '\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n',
      '\n\n◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇\n\n',
      '\n\n═══════════════════════════════════════════════════\n\n',
      '\n\n⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯\n\n'
    ];
    
    const divider = dividers[0]; // 기본적으로 첫 번째 스타일 사용
    
    const newContent = 
      content.substring(0, startPos) + 
      divider + 
      content.substring(endPos);
    
    setContent(newContent);
    
    // 커서를 구분선 다음으로 이동하고 스크롤 위치 유지
    setTimeout(() => {
      const newPos = startPos + divider.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
      // 현재 커서 위치 근처로 스크롤 유지
      const lineHeight = 20; // 대략적인 줄 높이
      const cursorLine = newContent.substring(0, newPos).split('\n').length;
      const scrollTop = Math.max(0, (cursorLine - 10) * lineHeight);
      textarea.scrollTop = scrollTop;
    }, 0);
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
            <div className="title-with-recent">
              <h1 className="document-title">📄 {selectedDocument.title}</h1>
              
              {/* 최근 문서 드롭다운 */}
              <div className="recent-documents-dropdown">
                <button 
                  className="recent-documents-btn"
                  onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                  title="최근 열어본 문서"
                >
                  📚 최근
                </button>
                
                {showRecentDropdown && (
                  <>
                    <div 
                      className="recent-dropdown-overlay" 
                      onClick={() => setShowRecentDropdown(false)}
                    />
                    <div className="recent-dropdown-menu">
                      <div className="recent-dropdown-header">최근 열어본 문서</div>
                      {getRecentDocuments().length > 0 ? (
                        getRecentDocuments().map((docHistory) => (
                          <button
                            key={docHistory.documentId}
                            className={`recent-dropdown-item ${docHistory.documentId === selectedDocument.id ? 'current' : ''}`}
                            onClick={() => handleRecentDocumentClick(docHistory)}
                            disabled={docHistory.documentId === selectedDocument.id}
                          >
                            <div className="recent-doc-title">📄 {docHistory.title}</div>
                            <div className="recent-doc-time">
                              {docHistory.accessedAt.toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="recent-dropdown-empty">최근 문서가 없습니다</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
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
              <button 
                className="action-button section-button"
                onClick={insertCollapsibleSection}
                title="접을 수 있는 영역 추가"
              >
                📁 섹션
              </button>
              <button 
                className="action-button divider-button"
                onClick={insertDivider}
                title="구분선 추가"
              >
                ━━ 구분선
              </button>
              <button 
                className="action-button move-button"
                onClick={handleGoToBottom}
                title="문서 맨 아래로 이동"
              >
                ⬇️ 맨 아래로
              </button>
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