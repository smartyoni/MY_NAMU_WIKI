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
  onZoomToggle,
  onStateChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // 접기/펼치기 토글
  const handleToggleCollapse = () => {
    onUpdateNode(node.id, { isCollapsed: !node.isCollapsed });
  };

  // 줌 토글
  const handleZoom = () => {
    onZoomToggle(node.id);
  };

  // 노드 인덱스 구하기 (형제 노드 중에서)
  const getNodeIndex = (): number => {
    // TODO: 부모의 children 배열에서 현재 노드의 인덱스 찾기
    return 0;
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
  const indentLevel = Math.min(node.level, 10); // 최대 10레벨

  return (
    <div className={`outliner-node level-${indentLevel}`}>
      {/* 노드 헤더 */}
      <div className="node-header">
        {/* 들여쓰기 가이드 */}
        {Array.from({ length: indentLevel }, (_, i) => (
          <div key={i} className="indent-guide" />
        ))}
        
        {/* 접기/펼치기 버튼 */}
        <button
          className={`collapse-button ${hasChildren ? 'has-children' : ''} ${node.isCollapsed ? 'collapsed' : ''}`}
          onClick={handleToggleCollapse}
          disabled={!hasChildren}
        >
          {hasChildren ? (node.isCollapsed ? '▶' : '▼') : '•'}
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

        {/* 액션 버튼들 (편집 모드에서만) */}
        {isEditMode && (
          <div className="node-actions">
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
          </div>
        )}
      </div>

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