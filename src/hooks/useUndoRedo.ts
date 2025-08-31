import { useState, useCallback } from 'react';

interface UndoRedoState<T> {
  history: T[];
  currentIndex: number;
}

export const useUndoRedo = <T>(initialState: T, maxHistorySize: number = 50) => {
  const [state, setState] = useState<UndoRedoState<T>>({
    history: [initialState],
    currentIndex: 0
  });

  const currentValue = state.history[state.currentIndex];

  const pushState = useCallback((newState: T) => {
    setState(prevState => {
      const newHistory = [
        ...prevState.history.slice(0, prevState.currentIndex + 1),
        newState
      ];

      // 히스토리 크기 제한
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1
      };
    });
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex > 0) {
        return {
          ...prevState,
          currentIndex: prevState.currentIndex - 1
        };
      }
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.currentIndex < prevState.history.length - 1) {
        return {
          ...prevState,
          currentIndex: prevState.currentIndex + 1
        };
      }
      return prevState;
    });
  }, []);

  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.history.length - 1;

  const resetHistory = useCallback((newInitialState: T) => {
    setState({
      history: [newInitialState],
      currentIndex: 0
    });
  }, []);

  return {
    currentValue,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory
  };
};