import { useState, useCallback } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  isVisible: boolean;
  targetId: string | null;
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    isVisible: false,
    targetId: null
  });

  const handleRightClick = useCallback((e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isVisible: true,
      targetId
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ 
      ...prev, 
      isVisible: false,
      targetId: null
    }));
  }, []);

  const isContextMenuOpen = contextMenu.isVisible;

  return { 
    contextMenu, 
    handleRightClick, 
    closeContextMenu, 
    isContextMenuOpen 
  };
};