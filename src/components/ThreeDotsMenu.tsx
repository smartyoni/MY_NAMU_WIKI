import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ThreeDotsMenu.css';

interface MenuItem {
  label: string;
  onClick: (e?: MouseEvent) => void;
  icon?: string;
}

interface ThreeDotsMenuProps {
  menuItems: MenuItem[];
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

const ThreeDotsMenu: React.FC<ThreeDotsMenuProps> = ({ menuItems, className = '', onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 메뉴 버튼이나 드롭다운 내부가 아닌 곳을 클릭했을 때만 닫기
      if (menuRef.current && !menuRef.current.contains(target) &&
          dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  const calculatePosition = () => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuHeight = menuItems.length * 40 + 20; // 대략적인 메뉴 높이 계산
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top: number;
      let left: number = rect.right - 140; // 오른쪽 정렬
      
      // 아래쪽 공간이 부족하고 위쪽에 충분한 공간이 있으면 위로 표시
      if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
        setDropdownPosition('top');
        top = rect.top - menuHeight - 2;
      } else {
        setDropdownPosition('bottom');
        top = rect.bottom + 2;
      }
      
      // 화면 좌측 경계 체크
      if (left < 10) {
        left = 10;
      }
      
      // 화면 우측 경계 체크
      if (left + 140 > window.innerWidth - 10) {
        left = window.innerWidth - 150;
      }
      
      setDropdownStyle({
        top: `${top}px`,
        left: `${left}px`,
        display: 'block'
      });
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen) {
      calculatePosition();
    }
    
    setIsOpen(!isOpen);
  };

  const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      item.onClick();
      setIsOpen(false);
    } catch (error) {
      console.error('Menu item click error:', error);
    }
  };

  return (
    <div className={`three-dots-menu ${className}`} ref={menuRef}>
      <button 
        className="three-dots-trigger"
        onClick={handleMenuClick}
        aria-label="메뉴 열기"
      >
        ⋮
      </button>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={`three-dots-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}
          style={dropdownStyle}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={(e) => handleItemClick(e, item)}
            >
              {item.icon && <span className="menu-icon">{item.icon}</span>}
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ThreeDotsMenu;