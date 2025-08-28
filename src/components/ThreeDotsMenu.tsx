import React, { useState, useRef, useEffect } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
      
      // 아래쪽 공간이 부족하고 위쪽에 충분한 공간이 있으면 위로 표시
      if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
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

  const handleItemClick = (item: MenuItem) => {
    item.onClick();
    setIsOpen(false);
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
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`three-dots-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="menu-icon">{item.icon}</span>}
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreeDotsMenu;