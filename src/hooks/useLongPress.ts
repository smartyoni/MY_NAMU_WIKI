import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (event: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  shouldPreventDefault?: boolean;
}

interface UseLongPressReturn {
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  onMouseLeave: (event: React.MouseEvent) => void;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
}

export const useLongPress = ({
  onLongPress,
  onClick,
  delay = 500,
  shouldPreventDefault = true
}: UseLongPressOptions): UseLongPressReturn => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const eventRef = useRef<React.TouchEvent | React.MouseEvent | null>(null);

  const startLongPress = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault) {
      event.preventDefault();
    }

    eventRef.current = event;
    isLongPressRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(event);
    }, delay);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!isLongPressRef.current && onClick) {
      onClick(event);
    }
  }, [onClick]);

  const onMouseDown = useCallback((event: React.MouseEvent) => {
    // 우클릭 방지 (컨텍스트 메뉴는 별도 처리)
    if (event.button !== 0) return;
    
    startLongPress(event);
  }, [startLongPress]);

  const onMouseUp = useCallback((event: React.MouseEvent) => {
    clearLongPress();
    handleClick(event);
  }, [clearLongPress, handleClick]);

  const onMouseLeave = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    startLongPress(event);
  }, [startLongPress]);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    clearLongPress();
    handleClick(event);
  }, [clearLongPress, handleClick]);

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd
  };
};