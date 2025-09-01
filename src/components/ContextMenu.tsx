import React, { useRef, useEffect, useState } from 'react';
import './ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
}

const calculateMenuPosition = (
  x: number, 
  y: number, 
  menuWidth: number, 
  menuHeight: number
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let adjustedX = x;
  let adjustedY = y;
  
  // 오른쪽 경계 체크
  if (x + menuWidth > viewportWidth) {
    adjustedX = x - menuWidth; // 마우스 왼쪽에 표시
  }
  
  // 아래쪽 경계 체크 (가장 중요!)
  if (y + menuHeight > viewportHeight) {
    adjustedY = y - menuHeight; // 마우스 위쪽에 표시
  }
  
  // 왼쪽 경계 체크 (마우스 왼쪽 표시시)
  if (adjustedX < 0) {
    adjustedX = 5; // 최소 여백
  }
  
  // 위쪽 경계 체크 (마우스 위쪽 표시시)  
  if (adjustedY < 0) {
    adjustedY = 5; // 최소 여백
  }
  
  return { x: adjustedX, y: adjustedY };
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, isVisible, onClose, items }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (isVisible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newPosition = calculateMenuPosition(x, y, rect.width, rect.height);
      setAdjustedPosition(newPosition);
    }
  }, [isVisible, x, y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{ 
        left: adjustedPosition.x, 
        top: adjustedPosition.y,
        position: 'fixed',
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.divider ? (
          <hr key={index} className="menu-divider" />
        ) : (
          <button
            key={index}
            className={`menu-item ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className="menu-icon">{item.icon}</span>}
            <span className="menu-label">{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
};

export default ContextMenu;