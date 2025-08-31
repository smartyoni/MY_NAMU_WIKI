import React, { useState, useRef, useEffect } from 'react';
import { OutlinerNode, OutlinerState } from '../types/outliner';
import './OutlinerNode.css';

interface OutlinerNodeProps {
  node: OutlinerNode;
  outlinerState: OutlinerState;
  isEditMode: boolean;
  onUpdateNode: (nodeId: string, updates: Partial<OutlinerNode>) => void;
  onAddNode: (parentId?: string, index?: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (draggedNodeId: string, targetNodeId: string, position: 'before' | 'after' | 'inside') => void;
  onZoomToggle: (nodeId?: string) => void;
  onStateChange: (updater: (prev: OutlinerState) => OutlinerState) => void;
}

const OutlinerNodeComponent: React.FC<OutlinerNodeProps> = ({
  node,
  outlinerState,
  isEditMode,
  onUpdateNode,
  onAddNode,
  onDeleteNode,
  onMoveNode,
  onZoomToggle,
  onStateChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNote, setEditNote] = useState(node.note || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | 'inside' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isFocused = outlinerState.focusedNodeId === node.id;

  useEffect(() => {
    if (isFocused && !isEditing) {
      setIsEditing(true);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isEditing && textareaRef.current && isEditMode) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing, isEditMode]);

  // 포커스 설정 (편집 모드에서만)
  const handleFocus = () => {
    if (isEditMode) {
      onStateChange(prev => ({ ...prev, focusedNodeId: node.id }));
      setIsEditing(true);
    }
  };

  // 편집 완료
  const handleBlur = () => {
    if (editContent !== node.content) {
      onUpdateNode(node.id, { content: editContent });
    }
    setIsEditing(false);
    onStateChange(prev => ({ ...prev, focusedNodeId: undefined }));
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Enter 또는 Cmd+Enter로 편집 완료
          e.preventDefault();
          handleBlur();
          // 현재 노드 다음에 새 노드 추가
          onAddNode(node.parentId, getNodeIndex() + 1);
        }
        // 일반 Enter는 줄바꿈으로 처리 (기본 동작)
        break;
        
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // 레벨 감소 (왼쪽으로 이동)
          if (node.level > 0) {
            onUpdateNode(node.id, { level: node.level - 1 });
          }
        } else {
          // 레벨 증가 (오른쪽으로 이동)
          onUpdateNode(node.id, { level: node.level + 1 });
        }
        break;
        
      case 'Backspace':
        if (editContent === '' && node.content === '') {
          e.preventDefault();
          onDeleteNode(node.id);
        }
        break;
        
      case 'ArrowUp':
        if (!isEditing) {
          e.preventDefault();
          // TODO: 이전 노드로 포커스 이동
        }
        break;
        
      case 'ArrowDown':
        if (!isEditing) {
          e.preventDefault();
          // TODO: 다음 노드로 포커스 이동
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setEditContent(node.content);
        handleBlur();
        break;
    }
  };

  // 접기/펼치기 토글 (자식 노드용)
  const handleToggleCollapse = () => {
    onUpdateNode(node.id, { isCollapsed: !node.isCollapsed });
  };

  // 노트 접기/펼치기 토글
  const handleToggleNoteCollapse = () => {
    onUpdateNode(node.id, { isNoteVisible: !node.isNoteVisible });
  };

  // 줌 토글
  const handleZoom = () => {
    onZoomToggle(node.id);
  };

  // 노트 토글
  const handleNoteToggle = () => {
    if (!node.note) {
      // 노트가 없으면 편집 모드로 바로 진입하고 표시
      setIsEditingNote(true);
      onUpdateNode(node.id, { isNoteVisible: true, note: '' });
    } else {
      // 노트가 있으면 표시/숨김 토글
      onUpdateNode(node.id, { isNoteVisible: !node.isNoteVisible });
    }
  };

  // 노트 편집 시작
  const handleNoteEdit = () => {
    setIsEditingNote(true);
  };

  // 노트 편집 완료
  const handleNoteBlur = () => {
    if (editNote !== (node.note || '')) {
      onUpdateNode(node.id, { note: editNote.trim() });
    }
    setIsEditingNote(false);
  };

  // 노트 삭제
  const handleNoteDelete = () => {
    onUpdateNode(node.id, { note: '', isNoteVisible: false });
    setEditNote('');
  };

  // 노드 인덱스 구하기 (형제 노드 중에서)
  const getNodeIndex = (): number => {
    // TODO: 부모의 children 배열에서 현재 노드의 인덱스 찾기
    return 0;
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditMode) return; // 편집 모드에서만 드래그 가능
    
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // 드래그 이미지 설정 (선택사항)
    if (nodeRef.current) {
      const dragImage = nodeRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // 마우스 위치에 따라 드롭 위치 결정
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (y < height * 0.25) {
      setDragOver('before');
    } else if (y > height * 0.75) {
      setDragOver('after');
    } else {
      setDragOver('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 자식 엘리먼트로 이동하는 경우는 무시
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    
    if (draggedNodeId !== node.id && dragOver) {
      onMoveNode(draggedNodeId, node.id, dragOver);
    }
    
    setDragOver(null);
  };

  // 개선된 마크다운 렌더링 (줄바꿈 및 URL 지원)
  const renderMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // 줄바꿈으로 분할하여 처리
    const lines = text.split('\n');
    
    return (
      <div className="markdown-content">
        {lines.map((line, lineIndex) => {
          if (line.trim() === '') {
            return <br key={lineIndex} />;
          }

          // URL 패턴 매칭
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match;

          while ((match = urlRegex.exec(line)) !== null) {
            // URL 이전 텍스트
            if (match.index > lastIndex) {
              const beforeText = line.slice(lastIndex, match.index);
              parts.push(processTextFormatting(beforeText, parts.length));
            }

            // URL 링크
            parts.push(
              <a
                key={parts.length}
                href={match[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
              >
                {match[0]}
              </a>
            );

            lastIndex = match.index + match[0].length;
          }

          // 남은 텍스트
          if (lastIndex < line.length) {
            const remainingText = line.slice(lastIndex);
            parts.push(processTextFormatting(remainingText, parts.length));
          }

          return (
            <div key={lineIndex} className="markdown-line">
              {parts.length > 0 ? parts : processTextFormatting(line, 0)}
            </div>
          );
        })}
      </div>
    );
  };

  // 텍스트 포맷팅 처리
  const processTextFormatting = (text: string, startKey: number): React.ReactNode => {
    if (!text) return null;

    // 볼드 처리
    let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 이탤릭 처리  
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // 인라인 코드 처리
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 취소선 처리
    processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return <span key={startKey} dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  const hasChildren = node.children.length > 0;
  const hasNote = Boolean(node.note);
  const hasCollapsibleContent = hasChildren || hasNote;
  const indentLevel = Math.min(node.level, 10); // 최대 10레벨

  return (
    <div 
      ref={nodeRef}
      className={`outliner-node level-${indentLevel} ${isDragging ? 'dragging' : ''} ${dragOver ? `drag-over-${dragOver}` : ''}`}
      draggable={isEditMode && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 노드 헤더 */}
      <div className="node-header">
        {/* 들여쓰기 가이드 */}
        {Array.from({ length: indentLevel }, (_, i) => (
          <div key={i} className="indent-guide" />
        ))}
        
        {/* 접기/펼치기 버튼 - 자식 노드와 노트를 통합 관리 */}
        <button
          className={`collapse-button ${hasCollapsibleContent ? 'has-children' : ''} ${(node.isCollapsed || !node.isNoteVisible) ? 'collapsed' : ''}`}
          onClick={() => {
            if (hasChildren && hasNote) {
              // 자식과 노트 모두 있으면 둘 다 토글
              const newCollapsedState = !((!node.isCollapsed) && node.isNoteVisible);
              onUpdateNode(node.id, { 
                isCollapsed: newCollapsedState,
                isNoteVisible: !newCollapsedState 
              });
            } else if (hasChildren) {
              // 자식만 있으면 자식만 토글
              handleToggleCollapse();
            } else if (hasNote) {
              // 노트만 있으면 노트만 토글
              handleToggleNoteCollapse();
            }
          }}
          disabled={!hasCollapsibleContent}
        >
          {hasCollapsibleContent ? 
            ((node.isCollapsed || !node.isNoteVisible) ? '▶' : '▼') : 
            '•'
          }
        </button>

        {/* 콘텐츠 영역 */}
        <div className="node-content" onClick={handleFocus}>
          {isEditMode && isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="node-textarea"
              placeholder="내용을 입력하세요... (Enter로 줄바꿈, Ctrl+Enter로 완료)"
              rows={editContent.split('\n').length || 1}
            />
          ) : (
            <div className="node-display">
              {node.content ? renderMarkdown(node.content) : (
                isEditMode ? (
                  <span className="placeholder">클릭하여 편집</span>
                ) : (
                  <span className="empty">내용 없음</span>
                )
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="node-actions">
          {/* 보기 모드에서는 노트 버튼 항상 표시 */}
          {!isEditMode && (
            <button
              className={`action-btn note-btn view-mode ${node.isNoteVisible ? 'active' : ''} ${node.note ? 'has-note' : ''}`}
              onClick={handleNoteToggle}
              title={node.note ? (node.isNoteVisible ? "노트 숨기기" : "노트 보기") : "노트 추가"}
            >
              📝
            </button>
          )}
          
          {/* 편집 모드에서는 모든 버튼 표시 */}
          {isEditMode && (
            <>
              {hasChildren && (
                <button
                  className="action-btn zoom-btn"
                  onClick={handleZoom}
                  title="이 노드에 집중"
                >
                  🔍
                </button>
              )}
              
              <button
                className={`action-btn note-btn ${node.isNoteVisible ? 'active' : ''} ${node.note ? 'has-note' : ''}`}
                onClick={handleNoteToggle}
                title={node.isNoteVisible ? "노트 숨기기" : "노트 추가"}
              >
                📝
              </button>
              
              <button
                className="action-btn add-btn"
                onClick={() => onAddNode(node.id)}
                title="하위 항목 추가"
              >
                +
              </button>
              
              <button
                className="action-btn delete-btn"
                onClick={() => onDeleteNode(node.id)}
                title="삭제"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {/* 노트 섹션 */}
      {((node.isNoteVisible && node.note) || (node.note && isEditingNote)) && (
        <div className="node-note-section">
          <div className="note-header">
            <span className="note-label">📝 노트</span>
            {isEditMode && (
              <div className="note-actions">
                {!isEditingNote && (
                  <button
                    className="note-action-btn edit-note-btn"
                    onClick={handleNoteEdit}
                    title="노트 편집"
                  >
                    ✏️
                  </button>
                )}
                <button
                  className="note-action-btn delete-note-btn"
                  onClick={handleNoteDelete}
                  title="노트 삭제"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
          
          <div className="note-content">
            {isEditMode && isEditingNote ? (
              <textarea
                ref={noteTextareaRef}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                onBlur={handleNoteBlur}
                className="note-textarea"
                placeholder="여러 줄 노트를 작성하세요..."
                autoFocus
                rows={Math.max(3, editNote.split('\n').length)}
              />
            ) : (
              <div 
                className="note-display"
                onDoubleClick={isEditMode ? handleNoteEdit : undefined}
                title={isEditMode ? "더블클릭하여 편집" : ""}
              >
                {node.note ? (
                  <div className="note-markdown">
                    {renderMarkdown(node.note)}
                  </div>
                ) : (
                  <span className="note-placeholder">
                    {isEditMode ? "클릭하여 노트를 추가하세요" : "노트 없음"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 자식 노드들 */}
      {!node.isCollapsed && hasChildren && (
        <div className="node-children">
          {node.children.map(child => (
            <OutlinerNodeComponent
              key={child.id}
              node={child}
              outlinerState={outlinerState}
              isEditMode={isEditMode}
              onUpdateNode={onUpdateNode}
              onAddNode={onAddNode}
              onDeleteNode={onDeleteNode}
              onMoveNode={onMoveNode}
              onZoomToggle={onZoomToggle}
              onStateChange={onStateChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OutlinerNodeComponent;