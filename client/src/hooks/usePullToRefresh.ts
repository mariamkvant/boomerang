import { useRef, useEffect, useCallback } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>, containerRef?: React.RefObject<HTMLElement>) {
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollTop = containerRef?.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [containerRef]);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!pulling.current) return;
    const diff = e.changedTouches[0].clientY - startY.current;
    pulling.current = false;
    if (diff > 80) {
      await onRefresh();
    }
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef?.current ?? window;
    el.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    el.addEventListener('touchend', handleTouchEnd as any, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart as any);
      el.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchEnd, containerRef]);
}
