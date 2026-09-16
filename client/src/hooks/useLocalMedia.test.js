import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalMedia } from './useLocalMedia.js';

// Хелпер: фейковый MediaStream
function createMockStream({ audio = true, video = true } = {}) {
  const tracks = [];
  if (audio) {
    tracks.push({ kind: 'audio', enabled: true, stop: vi.fn() });
  }
  if (video) {
    tracks.push({ kind: 'video', enabled: true, stop: vi.fn() });
  }
  return {
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
    addTrack: vi.fn((t) => tracks.push(t)),
    removeTrack: vi.fn((t) => {
      const idx = tracks.indexOf(t);
      if (idx >= 0) tracks.splice(idx, 1);
    }),
    _tracks: tracks,
  };
}

describe('useLocalMedia', () => {
  let originalMediaDevices;

  beforeEach(() => {
    originalMediaDevices = navigator.mediaDevices;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  function mockGetUserMedia(impl) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: impl },
      configurable: true,
    });
  }

  it('получает stream с audio и video', async () => {
    const mockStream = createMockStream();
    mockGetUserMedia(vi.fn().mockResolvedValue(mockStream));

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => expect(result.current.stream).toBe(mockStream));
    expect(result.current.audioEnabled).toBe(true);
    expect(result.current.videoEnabled).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('обрабатывает NotAllowedError (все устройства запрещены)', async () => {
    mockGetUserMedia(
      vi.fn().mockRejectedValue(
        Object.assign(new Error('denied'), { name: 'NotAllowedError' })
      )
    );

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.stream).toBeNull();
    expect(result.current.audioEnabled).toBe(false);
    expect(result.current.videoEnabled).toBe(false);
    expect(result.current.error.code).toBe('MEDIA_DENIED');
  });

  it('fallback: audio-only, если video не доступен', async () => {
    const audioOnly = createMockStream({ audio: true, video: false });
    mockGetUserMedia(
      vi
        .fn()
        .mockRejectedValueOnce(new Error('no video'))
        .mockResolvedValueOnce(audioOnly)
    );

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => expect(result.current.stream).toBe(audioOnly));
    expect(result.current.audioEnabled).toBe(true);
    expect(result.current.videoEnabled).toBe(false);
    expect(result.current.error.code).toBe('NO_VIDEO');
  });

  it('fallback: video-only, если audio не доступен', async () => {
    const videoOnly = createMockStream({ audio: false, video: true });
    mockGetUserMedia(
      vi
        .fn()
        .mockRejectedValueOnce(new Error('full fail'))
        .mockRejectedValueOnce(new Error('audio fail'))
        .mockResolvedValueOnce(videoOnly)
    );

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => expect(result.current.stream).toBe(videoOnly));
    expect(result.current.audioEnabled).toBe(false);
    expect(result.current.videoEnabled).toBe(true);
    expect(result.current.error.code).toBe('NO_AUDIO');
  });

  it('toggleAudio переключает track.enabled', async () => {
    const mockStream = createMockStream();
    mockGetUserMedia(vi.fn().mockResolvedValue(mockStream));

    const { result } = renderHook(() => useLocalMedia());
    await waitFor(() => expect(result.current.stream).toBe(mockStream));

    expect(result.current.audioEnabled).toBe(true);

    act(() => result.current.toggleAudio());
    expect(result.current.audioEnabled).toBe(false);
    expect(mockStream.getAudioTracks()[0].enabled).toBe(false);

    act(() => result.current.toggleAudio());
    expect(result.current.audioEnabled).toBe(true);
    expect(mockStream.getAudioTracks()[0].enabled).toBe(true);
  });

  it('toggleVideo выключает и останавливает трек', async () => {
    const mockStream = createMockStream();
    mockGetUserMedia(vi.fn().mockResolvedValue(mockStream));

    const { result } = renderHook(() => useLocalMedia());
    await waitFor(() => expect(result.current.stream).toBe(mockStream));

    const videoTrack = mockStream.getVideoTracks()[0];

    await act(async () => {
      await result.current.toggleVideo();
    });

    expect(result.current.videoEnabled).toBe(false);
    expect(videoTrack.stop).toHaveBeenCalledOnce();
    expect(mockStream.removeTrack).toHaveBeenCalledWith(videoTrack);
  });

  it('cleanup останавливает все треки', async () => {
    const mockStream = createMockStream();
    mockGetUserMedia(vi.fn().mockResolvedValue(mockStream));

    const { unmount } = renderHook(() => useLocalMedia());
    await new Promise((r) => setTimeout(r, 10));

    unmount();

    for (const t of mockStream._tracks) {
      expect(t.stop).toHaveBeenCalled();
    }
  });
});