import React, { useEffect, useRef } from 'react';
import { OutlinerNode } from '../types/outliner';
import './NodeContextMenu.css';

interface NodeContextMenuProps {
  node: OutlinerNode;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onAddNote: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onZoom?: () => void;
  canPaste?: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  position,
  onClose,
  onEdit,
  onAddNote,
  onAddChild,
  onDelete,
  onMove,
  onCopy,
  onPaste,
  onZoom,
  canPaste = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [finalPosition, setFinalPosition] = React.useState(position);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 메뉴 렌더링 후 정확한 위치 계산
  useEffect(() => {
    if (menuRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth <= 768;

      // 모바일에서는 CSS에서 처리하므로 위치 계산 생략
      if (isMobile) {
        setFinalPosition(position);
        return;
      }

      const menuRect = menuRef.current.getBoundingClientRect();
      let { x, y } = position;

      // 오른쪽 경계 체크 - 메뉴를 왼쪽으로 이동
      if (x + menuRect.width > windowWidth) {
        x = Math.max(10, x - menuRect.width);
      }

      // 하단 경계 체크 - 메뉴를 위로 이동  
      if (y + menuRect.height > windowHeight) {
        y = Math.max(10, y - menuRect.height);
      }

      // 최소 마진 확보
      x = Math.max(10, Math.min(x, windowWidth - menuRect.width - 10));
      y = Math.max(10, Math.min(y, windowHeight - menuRect.height - 10));

      setFinalPosition({ x, y });
    }
  }, [position]);

  // 초기 위치 추정 (빠른 렌더링을 위해)
  const adjustedPosition = React.useMemo(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 예상 메뉴 크기 (실제 렌더링 전 추정)
    const estimatedMenuWidth = 250;
    const estimatedMenuHeight = 280;

    let { x, y } = position;

    // 오른쪽 경계 체크 - 메뉴를 왼쪽으로 이동
    if (x + estimatedMenuWidth > windowWidth) {
      x = Math.max(10, x - estimatedMenuWidth);
    }

    // 하단 경계 체크 - 메뉴를 위로 이동
    if (y + estimatedMenuHeight > windowHeight) {
      y = Math.max(10, y - estimatedMenuHeight);
    }

    // 최소 마진 확보
    x = Math.max(10, Math.min(x, windowWidth - estimatedMenuWidth - 10));
    y = Math.max(10, Math.min(y, windowHeight - estimatedMenuHeight - 10));

    return { x, y };
  }, [position]);

  const handleMenuClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="node-context-menu"
      style={{
        position: 'fixed',
        left: finalPosition.x,
        top: finalPosition.y,
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-header">
        <span className="node-title">
          {node.content || '제목 없음'}
        </span>
      </div>

      <div className="context-menu-section">
        <button
          className="context-menu-item primary"
          onClick={() => handleMenuClick(onEdit)}
        >
          <span className="menu-icon">✏️</span>
          <span className="menu-text">수정</span>
          <span className="menu-shortcut">Enter</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => handleMenuClick(onAddChild)}
        >
          <span className="menu-icon">➕</span>
          <span className="menu-text">노트추가</span>
          <span className="menu-shortcut">Ctrl+Enter</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => handleMenuClick(onAddNote)}
        >
          <span className="menu-icon">📝</span>
          <span className="menu-text">
            {node.note ? (node.isNoteVisible ? '노트 숨기기' : '노트 보기') : '노트 추가'}
          </span>
        </button>
      </div>

      <div className="context-menu-section">
        <button
          className="context-menu-item"
          onClick={() => handleMenuClick(onMove)}
        >
          <span className="menu-icon">🔄</span>
          <span className="menu-text">이동</span>
          <span className="menu-shortcut">Ctrl+X</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => handleMenuClick(onCopy)}
        >
          <span className="menu-icon">📋</span>
          <span className="menu-text">복사</span>
          <span className="menu-shortcut">Ctrl+C</span>
        </button>

        {canPaste && (
          <button
            className="context-menu-item"
            onClick={() => handleMenuClick(onPaste)}
          >
            <span className="menu-icon">📄</span>
            <span className="menu-text">붙여넣기</span>
            <span className="menu-shortcut">Ctrl+V</span>
          </button>
        )}
      </div>

      {node.children.length > 0 && onZoom && (
        <div className="context-menu-section">
          <button
            className="context-menu-item"
            onClick={() => handleMenuClick(onZoom)}
          >
            <span className="menu-icon">🔍</span>
            <span className="menu-text">이 노드에 집중</span>
          </button>
        </div>
      )}

      <div className="context-menu-section">
        <button
          className="context-menu-item danger"
          onClick={() => handleMenuClick(onDelete)}
        >
          <span className="menu-icon">🗑️</span>
          <span className="menu-text">삭제</span>
          <span className="menu-shortcut">Del</span>
        </button>
      </div>
    </div>
  );
};

export default NodeContextMenu;