import React, { useState, useEffect, useRef } from 'react';
import { OutlinerNode, OutlinerState } from '../types/outliner';
import { useDocuments } from '../context/DocumentContextFirebase';
import OutlinerNodeComponent from './OutlinerNode';
import { useNodeClipboard } from '../hooks/useNodeClipboard';
import { useUndoRedo } from '../hooks/useUndoRedo';
import './OutlinerPanel.css';

interface OutlinerPanelProps {
  className?: string;
}

const OutlinerPanel: React.FC<OutlinerPanelProps> = ({ className = '' }) => {
  const { 
    uiState,
    updateDocument,
    deleteDocument,
    getSelectedDocument,
    toggleFavorite
  } = useDocuments();

  const [outlinerState, setOutlinerState] = useState<OutlinerState>({
    focusedNodeId: undefined,
    selectedNodeIds: [],
    zoomedNodeId: undefined
  });

  const [nodes, setNodes] = useState<OutlinerNode[]>([]);
  const [title, setTitle] = useState('');
  // 편집 모드 제거 - 항상 인라인 편집 가능
  const containerRef = useRef<HTMLDivElement>(null);

  // 클립보드와 실행취소 기능
  const { copyNode, cutNode, pasteNode, canPaste, clearClipboard } = useNodeClipboard();
  const { currentValue: undoableNodes, pushState: pushNodesState, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo<OutlinerNode[]>([]);

  const selectedDocument = getSelectedDocument();

  // 모든 하위 노드를 접는 함수
  const collapseAllChildren = (nodeList: OutlinerNode[]): OutlinerNode[] => {
    return nodeList.map(node => ({
      ...node,
      isCollapsed: node.children.length > 0, // 자식이 있으면 접기
      children: collapseAllChildren(node.children) // 재귀적으로 모든 하위 노드 처리
    }));
  };

  // 문서 선택 시 아웃라이너 노드로 변환
  useEffect(() => {
    if (selectedDocument) {
      setTitle(selectedDocument.title);
      const convertedNodes = convertTextToOutliner(selectedDocument.content);
      setNodes(convertedNodes);
    } else {
      setTitle('');
      setNodes([]);
    }
  }, [selectedDocument]);

  // 텍스트를 아웃라이너 노드로 변환 (불릿 포인트 기반으로만)
  const convertTextToOutliner = (text: string): OutlinerNode[] => {
    if (!text.trim()) {
      return [createNewNode('', 0)];
    }

    const lines = text.split('\n');
    const nodeStack: OutlinerNode[] = [];
    const rootNodes: OutlinerNode[] = [];
    let currentContent: string[] = [];

    lines.forEach((line, index) => {
      // 노트 라인인지 확인
      const noteMatch = line.match(/^(\s*)\[NOTE\]\s*(.*)$/);
      // 불릿 포인트로 시작하는 줄인지 확인
      const bulletMatch = line.match(/^(\s*)[•-]\s*(.*)$/);
      
      if (noteMatch && nodeStack.length > 0) {
        // 노트 라인은 마지막 노드에 노트로 추가
        const lastNode = nodeStack[nodeStack.length - 1];
        const noteContent = noteMatch[2];
        if (!lastNode.note) {
          lastNode.note = noteContent;
          lastNode.isNoteVisible = true;
        } else {
          lastNode.note += '\n' + noteContent;
        }
      } else if (bulletMatch) {
        // 이전 노드의 멀티라인 내용 처리
        if (currentContent.length > 0 && nodeStack.length > 0) {
          const lastNode = nodeStack[nodeStack.length - 1];
          lastNode.content += '\n' + currentContent.join('\n');
          currentContent = [];
        }

        // 새 노드 생성
        const indent = bulletMatch[1].length;
        const level = Math.floor(indent / 2);
        const content = bulletMatch[2].trim();
        
        const node = createNewNode(content, level, `node-${index}`);

        // 적절한 부모 찾기
        while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) {
          nodeStack.pop();
        }

        if (nodeStack.length === 0) {
          // 루트 노드
          rootNodes.push(node);
        } else {
          // 자식 노드
          const parent = nodeStack[nodeStack.length - 1];
          node.parentId = parent.id;
          parent.children.push(node);
        }

        nodeStack.push(node);
      } else if (line.trim() && nodeStack.length > 0) {
        // 불릿 포인트가 없는 줄은 이전 노드의 추가 내용으로 처리
        currentContent.push(line.trim());
      }
    });

    // 마지막 노드의 멀티라인 내용 처리
    if (currentContent.length > 0 && nodeStack.length > 0) {
      const lastNode = nodeStack[nodeStack.length - 1];
      lastNode.content += '\n' + currentContent.join('\n');
    }

    // 모든 노드를 접힌 상태로 설정
    return collapseAllChildren(rootNodes.length > 0 ? rootNodes : [createNewNode('', 0)]);
  };

  // 새 노드 생성
  const createNewNode = (content: string, level: number, id?: string): OutlinerNode => ({
    id: id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    children: [],
    isCollapsed: false,
    level,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 아웃라이너를 텍스트로 변환
  const convertOutlinerToText = (nodes: OutlinerNode[]): string => {
    const convertNodes = (nodeList: OutlinerNode[], depth: number = 0): string[] => {
      const lines: string[] = [];
      
      nodeList.forEach(node => {
        const indent = '  '.repeat(depth);
        const bullet = depth === 0 ? '•' : '-';
        const content = node.content || '';
        
        if (content.trim() || depth === 0) {
          lines.push(`${indent}${bullet} ${content}`);
        }
        
        // 노트가 있으면 특별한 형식으로 추가
        if (node.note && node.note.trim()) {
          const noteLines = node.note.split('\n');
          noteLines.forEach(noteLine => {
            lines.push(`${indent}  [NOTE] ${noteLine}`);
          });
        }
        
        if (!node.isCollapsed && node.children.length > 0) {
          lines.push(...convertNodes(node.children, depth + 1));
        }
      });
      
      return lines;
    };

    return convertNodes(nodes).join('\n');
  };

  // 노드 업데이트 (실행취소 지원)
  const updateNode = (nodeId: string, updates: Partial<OutlinerNode>) => {
    const updateNodeInTree = (nodeList: OutlinerNode[]): OutlinerNode[] => {
      return nodeList.map(node => {
        if (node.id === nodeId) {
          // 노트가 업데이트되고 내용이 있으면 자동으로 표시
          let finalUpdates = { ...updates, updatedAt: new Date() };
          if (updates.note !== undefined && updates.note.trim() !== '') {
            finalUpdates.isNoteVisible = true;
          }
          return { ...node, ...finalUpdates };
        }
        return {
          ...node,
          children: updateNodeInTree(node.children)
        };
      });
    };

    setNodes(prevNodes => {
      const updatedNodes = updateNodeInTree(prevNodes);
      pushNodesState(updatedNodes);
      return updatedNodes;
    });
  };

  // 새 노드 추가 (실행취소 지원)
  const addNode = (parentId?: string, index?: number) => {
    const newNode = createNewNode('', 0);

    let updatedNodes;
    if (!parentId) {
      // 루트 레벨에 추가
      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        const insertIndex = index !== undefined ? index : newNodes.length;
        newNodes.splice(insertIndex, 0, newNode);
        updatedNodes = newNodes;
        pushNodesState(updatedNodes);
        return updatedNodes;
      });
    } else {
      // 특정 부모의 자식으로 추가
      const addToParent = (nodeList: OutlinerNode[]): OutlinerNode[] => {
        return nodeList.map(node => {
          if (node.id === parentId) {
            const newChild = { ...newNode, level: node.level + 1, parentId };
            const children = [...node.children];
            const insertIndex = index !== undefined ? index : children.length;
            children.splice(insertIndex, 0, newChild);
            return { ...node, children };
          }
          return {
            ...node,
            children: addToParent(node.children)
          };
        });
      };

      setNodes(prevNodes => {
        updatedNodes = addToParent(prevNodes);
        pushNodesState(updatedNodes);
        return updatedNodes;
      });
    }

    // 새 노드에 포커스
    setOutlinerState(prev => ({ ...prev, focusedNodeId: newNode.id }));
  };

  // 노드 삭제 (하위 노드 처리 옵션 포함)
  const deleteNode = (nodeId: string, options?: { deleteChildren?: boolean }) => {
    const deleteFromTree = (nodeList: OutlinerNode[], parentLevel: number = 0): OutlinerNode[] => {
      const result: OutlinerNode[] = [];
      
      nodeList.forEach(node => {
        if (node.id === nodeId) {
          // 삭제될 노드를 찾음
          if (options?.deleteChildren === false && node.children.length > 0) {
            // 자식 노드들을 독립시켜서 상위 레벨로 이동
            const independentChildren = node.children.map(child => ({
              ...child,
              level: Math.max(0, node.level), // 부모와 같은 레벨로 설정
              parentId: node.parentId // 부모의 부모를 새로운 부모로 설정
            }));
            result.push(...independentChildren);
          }
          // 노드 자체는 삭제 (return하지 않음)
        } else {
          // 다른 노드는 유지하고 자식도 재귀적으로 처리
          result.push({
            ...node,
            children: deleteFromTree(node.children, node.level + 1)
          });
        }
      });
      
      return result;
    };

    setNodes(prevNodes => {
      const updatedNodes = deleteFromTree(prevNodes);
      pushNodesState(updatedNodes);
      return updatedNodes;
    });
  };

  // 노드 이동 (드래그 앤 드롭)
  const moveNode = (draggedNodeId: string, targetNodeId: string, position: 'before' | 'after' | 'inside') => {
    let draggedNode: OutlinerNode | null = null;
    
    // 1. 드래그된 노드 찾기 및 제거
    const removeDraggedNode = (nodeList: OutlinerNode[]): OutlinerNode[] => {
      return nodeList.filter(node => {
        if (node.id === draggedNodeId) {
          draggedNode = { ...node };
          return false;
        }
        node.children = removeDraggedNode(node.children);
        return true;
      });
    };

    // 2. 타겟 위치에 노드 삽입
    const insertNodeAtTarget = (nodeList: OutlinerNode[], targetLevel: number = 0): OutlinerNode[] => {
      return nodeList.flatMap((node, index, array) => {
        if (node.id === targetNodeId && draggedNode) {
          const updatedDraggedNode = { 
            ...draggedNode, 
            level: position === 'inside' ? node.level + 1 : node.level,
            parentId: position === 'inside' ? node.id : node.parentId
          };

          if (position === 'before') {
            return [updatedDraggedNode, { ...node, children: insertNodeAtTarget(node.children, node.level + 1) }];
          } else if (position === 'after') {
            return [{ ...node, children: insertNodeAtTarget(node.children, node.level + 1) }, updatedDraggedNode];
          } else { // inside
            return [{
              ...node,
              children: [...insertNodeAtTarget(node.children, node.level + 1), updatedDraggedNode]
            }];
          }
        }
        return [{ ...node, children: insertNodeAtTarget(node.children, node.level + 1) }];
      });
    };

    if (draggedNodeId === targetNodeId) return; // 자기 자신에게는 이동 불가

    setNodes(prevNodes => {
      const nodesWithoutDragged = removeDraggedNode(prevNodes);
      let updatedNodes;
      if (draggedNode) {
        updatedNodes = insertNodeAtTarget(nodesWithoutDragged);
      } else {
        updatedNodes = nodesWithoutDragged;
      }
      pushNodesState(updatedNodes);
      return updatedNodes;
    });
  };

  // 문서 자동 저장 (디바운스 적용)
  const handleAutoSave = React.useCallback(async () => {
    if (!selectedDocument) return;

    try {
      const textContent = convertOutlinerToText(nodes);
      await updateDocument(selectedDocument.id, {
        title: title.trim(),
        content: textContent
      });
    } catch (error) {
      console.error('문서 자동 저장 실패:', error);
    }
  }, [selectedDocument, nodes, title, updateDocument, convertOutlinerToText]);

  // 디바운스된 자동 저장 (변경 후 2초 후 저장)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, title, handleAutoSave]);

  // 즐겨찾기 토글
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

  // 줌 토글
  const handleZoomToggle = (nodeId?: string) => {
    setOutlinerState(prev => ({
      ...prev,
      zoomedNodeId: prev.zoomedNodeId === nodeId ? undefined : nodeId
    }));
  };

  // 클립보드 기능들
  const handleCopyNode = (node: OutlinerNode) => {
    copyNode(node);
  };

  const handleCutNode = (node: OutlinerNode) => {
    cutNode(node);
  };

  const handlePasteNode = (targetNodeId: string) => {
    const pastedNode = pasteNode(() => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    if (pastedNode) {
      // 타겟 노드의 자식으로 추가
      const addPastedNode = (nodeList: OutlinerNode[]): OutlinerNode[] => {
        return nodeList.map(node => {
          if (node.id === targetNodeId) {
            const newChild = { ...pastedNode, level: node.level + 1, parentId: targetNodeId };
            return { ...node, children: [...node.children, newChild] };
          }
          return {
            ...node,
            children: addPastedNode(node.children)
          };
        });
      };

      setNodes(prevNodes => {
        const updatedNodes = addPastedNode(prevNodes);
        pushNodesState(updatedNodes);
        return updatedNodes;
      });
    }
  };

  // 키보드 단축키 처리 (항상 활성)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        setNodes(undoableNodes);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        setNodes(undoableNodes);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo, undoableNodes]);

  // 실행취소 상태와 nodes 동기화
  useEffect(() => {
    if (undoableNodes.length > 0 && undoableNodes !== nodes) {
      setNodes(undoableNodes);
    }
  }, [undoableNodes]);

  // 새 문서 로드 시 실행취소 히스토리 리셋
  useEffect(() => {
    if (selectedDocument) {
      resetHistory(nodes);
    }
  }, [selectedDocument?.id]);

  if (!selectedDocument) {
    return (
      <div className={`outliner-panel ${className}`}>
        <div className="empty-state">
          <div className="empty-content">
            <h2>📝 아웃라이너 모드</h2>
            <p>문서를 선택하여 아웃라이너로 편집하세요.</p>
            <div className="help-text">
              <small>
                • 계층적 구조로 아이디어를 정리하세요<br />
                • 각 항목에서 마크다운 문법을 사용할 수 있습니다<br />
                • Tab/Shift+Tab으로 레벨을 조정하세요
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 줌된 노드가 있으면 해당 노드와 자식들만 표시
  const displayNodes = outlinerState.zoomedNodeId 
    ? nodes.flatMap(node => findNodeAndChildren(node, outlinerState.zoomedNodeId!))
    : nodes;

  return (
    <div className={`outliner-panel ${className}`} ref={containerRef}>
      {/* 헤더 */}
      <div className="outliner-header">
        <div className="outliner-title-section">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="outliner-title-input"
            placeholder="문서 제목"
          />
        </div>
        
        <div className="outliner-actions">
          <button 
            className={`action-button favorite-button ${selectedDocument.isFavorite === true ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
            title={selectedDocument.isFavorite === true ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            {selectedDocument.isFavorite === true ? '⭐' : '☆'}
          </button>
          
          <button 
            className={`action-button undo-button ${!canUndo ? 'disabled' : ''}`}
            onClick={undo}
            disabled={!canUndo}
            title="실행취소 (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            className={`action-button redo-button ${!canRedo ? 'disabled' : ''}`}
            onClick={redo}
            disabled={!canRedo}
            title="다시실행 (Ctrl+Y)"
          >
            ↷
          </button>
          
          {outlinerState.zoomedNodeId && (
            <button 
              className="action-button zoom-out-button"
              onClick={() => handleZoomToggle()}
              title="줌 아웃"
            >
              🔍 줌 아웃
            </button>
          )}
          
          <span className="auto-save-indicator" title="변경사항이 자동으로 저장됩니다">
            💾 자동저장
          </span>
        </div>
      </div>

      {/* 아웃라이너 콘텐츠 */}
      <div className="outliner-content">
        {displayNodes.map(node => (
          <OutlinerNodeComponent
            key={node.id}
            node={node}
            outlinerState={outlinerState}
            isEditMode={true}
            onUpdateNode={updateNode}
            onAddNode={addNode}
            onDeleteNode={deleteNode}
            onMoveNode={moveNode}
            onZoomToggle={handleZoomToggle}
            onStateChange={setOutlinerState}
            onEnterEditMode={() => {}}
            onCopyNode={handleCopyNode}
            onCutNode={handleCutNode}
            onPasteNode={handlePasteNode}
            canPaste={canPaste}
          />
        ))}
        
        {/* 새 노드 추가 버튼 */}
        <div className="add-node-section">
          <button 
            className="add-node-button"
            onClick={() => addNode()}
            title="새 항목 추가"
          >
            + 새 항목 추가
          </button>
        </div>
      </div>
    </div>
  );
};

// 특정 노드와 그 자식들을 찾는 헬퍼 함수
const findNodeAndChildren = (node: OutlinerNode, targetId: string): OutlinerNode[] => {
  if (node.id === targetId) {
    return [node];
  }
  
  for (const child of node.children) {
    const found = findNodeAndChildren(child, targetId);
    if (found.length > 0) {
      return found;
    }
  }
  
  return [];
};

export default OutlinerPanel;