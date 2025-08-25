import React, { useState, useRef, useEffect } from 'react';
import './ThreeDotsMenu.css';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface ThreeDotsMenuProps {
  menuItems: MenuItem[];
  className?: string;
}

const ThreeDotsMenu: React.FC<ThreeDotsMenuProps> = ({ menuItems, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        <div className="three-dots-dropdown">
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