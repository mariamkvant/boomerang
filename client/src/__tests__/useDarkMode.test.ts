import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../hooks/useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to system preference', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(typeof result.current.dark).toBe('boolean');
  });

  it('toggles dark mode', () => {
    const { result } = renderHook(() => useDarkMode());
    const initial = result.current.dark;
    act(() => result.current.toggle());
    expect(result.current.dark).toBe(!initial);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(localStorage.getItem('darkMode')).toBeTruthy();
  });
});
