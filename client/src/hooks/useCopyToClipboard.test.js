import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard.js';

describe('useCopyToClipboard', () => {
  let originalClipboard;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mockClipboard(impl) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: impl },
      configurable: true,
    });
  }

  it('копирует текст через современный API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());

    let ok;
    await act(async () => {
      ok = await result.current.copy('hello');
    });

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('сбрасывает copied через resetDelay', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy('hello');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.copied).toBe(false);
  });

  it('использует execCommand fallback, если clipboard API недоступен', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    const { result } = renderHook(() => useCopyToClipboard());

    let ok;
    await act(async () => {
      ok = await result.current.copy('hello');
    });

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
  });

  it('возвращает false и error, если оба API упали', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    mockClipboard(writeText);
    document.execCommand = vi.fn().mockReturnValue(false);

    const { result } = renderHook(() => useCopyToClipboard());

    let ok;
    await act(async () => {
      ok = await result.current.copy('hello');
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBe('Не удалось скопировать');
  });

  it('очищает таймер при размонтировании (не падает)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const { result, unmount } = renderHook(() => useCopyToClipboard(1000));
    await act(async () => {
      await result.current.copy('hello');
    });

    unmount();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});