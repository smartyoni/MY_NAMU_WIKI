import { useState, useCallback } from 'react';
import { OutlinerNode } from '../types/outliner';

interface ClipboardData {
  node: OutlinerNode;
  operation: 'copy' | 'cut';
}

export const useNodeClipboard = () => {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const copyNode = useCallback((node: OutlinerNode) => {
    setClipboard({
      node: { ...node },
      operation: 'copy'
    });
  }, []);

  const cutNode = useCallback((node: OutlinerNode) => {
    setClipboard({
      node: { ...node },
      operation: 'cut'
    });
  }, []);

  const pasteNode = useCallback((generateNewId?: () => string): OutlinerNode | null => {
    if (!clipboard) return null;

    const pastedNode = {
      ...clipboard.node,
      id: generateNewId ? generateNewId() : clipboard.node.id,
      children: clipboard.node.children.map(child => ({
        ...child,
        id: generateNewId ? generateNewId() : child.id
      }))
    };

    // Cut 작업 후에는 클립보드 비우기
    if (clipboard.operation === 'cut') {
      setClipboard(null);
    }

    return pastedNode;
  }, [clipboard]);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  const canPaste = clipboard !== null;
  const isCutOperation = clipboard?.operation === 'cut';

  return {
    copyNode,
    cutNode,
    pasteNode,
    clearClipboard,
    canPaste,
    isCutOperation
  };
};