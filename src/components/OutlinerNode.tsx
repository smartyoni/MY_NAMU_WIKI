import React, { useState, useRef, useEffect } from 'react';
import { OutlinerNode, OutlinerState } from '../types/outliner';
import NodeContextMenu from './NodeContextMenu';
import { useLongPress } from '../hooks/useLongPress';
import './OutlinerNode.css';

interface OutlinerNodeProps {
  node: OutlinerNode;
  outlinerState: OutlinerState;
  isEditMode: boolean;
  onUpdateNode: (nodeId: string, updates: Partial<OutlinerNode>, skipUndoHistory?: boolean) => void;
  onAddNode: (parentId?: string, index?: number) => void;
  onDeleteNode: (nodeId: string, options?: { deleteChildren?: boolean }) => void;
  onMoveNode: (draggedNodeId: string, targetNodeId: string, position: 'before' | 'after' | 'inside') => void;
  onZoomToggle: (nodeId?: string) => void;
  onStateChange: (updater: (prev: OutlinerState) => OutlinerState) => void;
  onEnterEditMode?: () => void;
  onCopyNode?: (node: OutlinerNode) => void;
  onCutNode?: (node: OutlinerNode) => void;
  onPasteNode?: (targetNodeId: string) => void;
  canPaste?: boolean;
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
  onStateChange,
  onEnterEditMode,
  onCopyNode,
  onCutNode,
  onPasteNode,
  canPaste = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNote, setEditNote] = useState(node.note || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | 'inside' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isFocused = outlinerState.focusedNodeId === node.id;

  // 노드 내용과 편집 상태 동기화 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditing) {
      setEditContent(node.content);
    }
  }, [node.content, isEditing]);

  useEffect(() => {
    if (!isEditingNote) {
      setEditNote(node.note || '');
    }
  }, [node.note, isEditingNote]);

  useEffect(() => {
    if (isFocused && !isEditing) {
      setIsEditing(true);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      
      // 약간의 지연 후 커서 위치 설정 (브라우저 기본 동작 후 실행)
      setTimeout(() => {
        if (textarea === textareaRef.current) { // 여전히 같은 textarea인지 확인
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [isEditing]);

  // 포커스 설정 (클릭으로는 편집 모드 진입 안 함 - 하이퍼링크 보호)
  const handleFocus = () => {
    // 일반 클릭으로는 편집 모드 진입하지 않음
    // 오직 우클릭/롱프레스로만 편집 가능
  };

  // 편집 완료 (blur 또는 외부 클릭)
  const handleBlur = () => {
    if (editContent !== node.content) {
      onUpdateNode(node.id, { content: editContent }, false); // 편집 완료 시에는 히스토리에 추가
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
            onUpdateNode(node.id, { level: node.level - 1 }, true); // 중간 상태 - 히스토리 제외
          }
        } else {
          // 레벨 증가 (오른쪽으로 이동)
          onUpdateNode(node.id, { level: node.level + 1 }, true); // 중간 상태 - 히스토리 제외
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
    onUpdateNode(node.id, { isCollapsed: !node.isCollapsed }, true); // UI 상태 - 히스토리 제외
  };

  // 노트 접기/펼치기 토글
  const handleToggleNoteCollapse = () => {
    onUpdateNode(node.id, { isNoteVisible: !node.isNoteVisible }, true); // UI 상태 - 히스토리 제외
  };

  // 줌 토글
  const handleZoom = () => {
    onZoomToggle(node.id);
  };

  // 더블클릭으로도 편집 모드 진입 안 함 (하이퍼링크 보호)
  const handleDoubleClickToEdit = () => {
    // 더블클릭으로도 편집 모드 진입하지 않음
    // 오직 우클릭/롱프레스로만 편집 가능
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent) => {
    // 항상 컨텍스트 메뉴 허용 (편집 중에도 사용 가능)
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  // 롱프레스 핸들러 (모바일용)
  const handleLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    // 항상 롱프레스 메뉴 허용 (편집 중에도 사용 가능)
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    
    setContextMenu({
      x: clientX,
      y: clientY
    });
  };

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    delay: 1200, // 1.2초
    shouldPreventDefault: false // 좌클릭 기본 동작 방해하지 않음
  });

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 컨텍스트 메뉴 액션들
  const handleEdit = () => {
    // 우클릭/롱프레스로 편집 모드 진입
    setIsEditing(true);
    onStateChange(prev => ({ ...prev, focusedNodeId: node.id }));
  };

  const handleAddNote = () => {
    // 노트 추가/편집은 컨텍스트 메뉴를 통해서만 가능
    if (!node.note || node.note.trim() === '') {
      // 노트가 없으면 편집 모드로 바로 진입하고 표시
      setEditNote(''); // 빈 문자열로 시작
      setIsEditingNote(true);
      onUpdateNode(node.id, { isNoteVisible: true });
    } else {
      // 노트가 있으면 표시/숨김 토글 또는 편집 모드 진입
      if (node.isNoteVisible) {
        setIsEditingNote(true);
      } else {
        onUpdateNode(node.id, { isNoteVisible: true });
      }
    }
  };

  const handleAddChild = () => {
    onAddNode(node.id);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleMove = () => {
    if (onCutNode) {
      onCutNode(node);
    }
  };

  const handleCopy = () => {
    if (onCopyNode) {
      onCopyNode(node);
    }
  };

  const handlePaste = () => {
    if (onPasteNode) {
      onPasteNode(node.id);
    }
  };

  // 전역 클릭 이벤트로 컨텍스트 메뉴 닫기 및 편집 종료
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // 컨텍스트 메뉴 닫기
      if (contextMenu) {
        closeContextMenu();
      }
      
      // 편집 중이고 노드 외부 클릭 시 편집 종료
      if ((isEditing || isEditingNote) && nodeRef.current) {
        const target = event.target as Node;
        if (!nodeRef.current.contains(target)) {
          if (isEditing) {
            handleBlur();
          }
          if (isEditingNote) {
            handleNoteBlur();
          }
        }
      }
    };

    if (contextMenu || isEditing || isEditingNote) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }
  }, [contextMenu, isEditing, isEditingNote]);

  // 노트 토글
  const handleNoteToggle = () => {
    if (!node.note || node.note.trim() === '') {
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

  // 노트 편집 시 포커스 및 커서 위치 설정
  useEffect(() => {
    if (isEditingNote && noteTextareaRef.current) {
      const textarea = noteTextareaRef.current;
      textarea.focus();
      
      // 약간의 지연 후 커서 위치 설정 (브라우저 기본 동작 후 실행)
      setTimeout(() => {
        if (textarea === noteTextareaRef.current) { // 여전히 같은 textarea인지 확인
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [isEditingNote]);

  // 노트 편집 완료
  const handleNoteBlur = () => {
    if (editNote !== (node.note || '')) {
      const trimmedNote = editNote.trim();
      onUpdateNode(node.id, { 
        note: trimmedNote,
        isNoteVisible: trimmedNote !== '' // 노트가 있으면 자동 표시
      }, false); // 편집 완료 시에는 히스토리에 추가
    } else if (node.note && node.note.trim() !== '') {
      // 내용이 변경되지 않았지만 노트가 있다면 표시
      onUpdateNode(node.id, { isNoteVisible: true }, true);
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

  // 단순한 텍스트 렌더링 (하이퍼링크만 변환)
  const renderText = (text: string): React.ReactNode => {
    if (!text) return null;

    // 줄바꿈으로 분할하여 처리
    const lines = text.split('\n');
    
    return (
      <div className="text-content">
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
              parts.push(<span key={parts.length}>{beforeText}</span>);
            }

            // URL 링크
            parts.push(
              <a
                key={parts.length}
                href={match[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="auto-link"
              >
                {match[0]}
              </a>
            );

            lastIndex = match.index + match[0].length;
          }

          // 남은 텍스트
          if (lastIndex < line.length) {
            const remainingText = line.slice(lastIndex);
            parts.push(<span key={parts.length}>{remainingText}</span>);
          }

          return (
            <div key={lineIndex} className="text-line">
              {parts.length > 0 ? parts : line}
            </div>
          );
        })}
      </div>
    );
  };

  const hasChildren = node.children.length > 0;
  const hasNote = Boolean(node.note);
  const hasCollapsibleContent = hasChildren || hasNote;
  const indentLevel = Math.min(node.level, 10); // 최대 10레벨

  return (
    <div 
      ref={nodeRef}
      className={`outliner-node level-${indentLevel} ${isDragging ? 'dragging' : ''} ${dragOver ? `drag-over-${dragOver}` : ''}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      {...(!(isEditing || isEditingNote) ? longPressHandlers : {})}
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
        <div className="node-content">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => {
                // textarea 클릭 시 기본 커서 위치 이동 동작 보장
                e.stopPropagation();
              }}
              className="node-textarea"
              placeholder="내용을 입력하세요... (Enter로 줄바꿈, Ctrl+Enter로 완료)"
              rows={editContent.split('\n').length || 1}
            />
          ) : (
            <div 
              className="node-display"
              style={{ cursor: 'default' }}
            >
              {node.content ? renderText(node.content) : (
                <span className="empty">내용 없음</span>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="node-actions">
          {/* 복사 버튼 */}
          <button
            className="action-btn copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="노드 복사"
          >
            📋
          </button>
          
          {/* 노트 통합 버튼 (노트가 있을 때만 표시) */}
          {node.note && (
            <button
              className={`action-btn note-edit-btn ${node.isNoteVisible ? 'active' : ''}`}
              onClick={() => {
                if (node.isNoteVisible) {
                  setIsEditingNote(true); // 노트가 보이면 편집
                } else {
                  onUpdateNode(node.id, { isNoteVisible: true }, true); // 노트가 안 보이면 표시
                }
              }}
              title={node.isNoteVisible ? "노트 편집" : "노트 보기"}
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      {/* 노트 섹션 */}
      {((node.isNoteVisible && node.note) || isEditingNote) && (
        <div className="node-note-section">
          <div className="note-header">
            <span className="note-label">📝 노트</span>
            {/* 노트 편집 중에만 액션 버튼 표시 */}
            {isEditingNote && (
              <div className="note-actions">
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
            {isEditingNote ? (
              <textarea
                ref={noteTextareaRef}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                onBlur={handleNoteBlur}
                onClick={(e) => {
                  // textarea 클릭 시 기본 커서 위치 이동 동작 보장
                  e.stopPropagation();
                }}
                className="note-textarea"
                placeholder="여러 줄 노트를 작성하세요..."
                rows={Math.max(3, editNote.split('\n').length)}
              />
            ) : (
              <div 
                className="note-display"
                style={{ cursor: 'default' }}
              >
                {node.note ? (
                  <div className="note-text">
                    {renderText(node.note)}
                  </div>
                ) : (
                  <span className="note-placeholder">
                    "노트 없음"
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
              onCopyNode={onCopyNode}
              onCutNode={onCutNode}
              onPasteNode={onPasteNode}
              canPaste={canPaste}
              onMoveNode={onMoveNode}
              onZoomToggle={onZoomToggle}
              onStateChange={onStateChange}
              onEnterEditMode={onEnterEditMode}
            />
          ))}
        </div>
      )}

      {/* 새로운 컨텍스트 메뉴 */}
      {contextMenu && (
        <NodeContextMenu
          node={node}
          position={contextMenu}
          onClose={closeContextMenu}
          onEdit={handleEdit}
          onAddNote={handleAddNote}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
          onMove={handleMove}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onZoom={hasChildren ? handleZoom : undefined}
          canPaste={canPaste}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="modal-content">
            <h3>노드 삭제</h3>
            {node.children.length > 0 ? (
              <>
                <p>이 노드에 {node.children.length}개의 하위 노드가 있습니다.</p>
                <div className="modal-actions">
                  <button
                    className="btn-danger"
                    onClick={() => {
                      onDeleteNode(node.id, { deleteChildren: true });
                      setShowDeleteConfirm(false);
                    }}
                  >
                    하위 노드와 함께 삭제
                  </button>
                  <button
                    className="btn-warning"
                    onClick={() => {
                      onDeleteNode(node.id, { deleteChildren: false });
                      setShowDeleteConfirm(false);
                    }}
                  >
                    하위 노드는 독립시키고 삭제
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>이 노드를 삭제하시겠습니까?</p>
                <div className="modal-actions">
                  <button
                    className="btn-danger"
                    onClick={() => {
                      onDeleteNode(node.id);
                      setShowDeleteConfirm(false);
                    }}
                  >
                    삭제
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlinerNodeComponent;