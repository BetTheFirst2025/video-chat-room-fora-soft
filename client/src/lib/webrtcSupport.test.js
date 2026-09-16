import { describe, it, expect, vi, afterEach } from 'vitest';
import { isWebRTCSupported, getBrowserInfo } from './webrtcSupport.js';

describe('isWebRTCSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('возвращает true при полной поддержке', () => {
    vi.stubGlobal('RTCPeerConnection', function () {});
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: () => {} },
      userAgent: 'Mozilla/5.0 (Chrome)',
    });
    expect(isWebRTCSupported()).toBe(true);
  });

  it('возвращает false без RTCPeerConnection', () => {
    vi.stubGlobal('RTCPeerConnection', undefined);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: () => {} },
    });
    expect(isWebRTCSupported()).toBe(false);
  });

  it('возвращает false без getUserMedia', () => {
    vi.stubGlobal('RTCPeerConnection', function () {});
    vi.stubGlobal('navigator', { mediaDevices: {} });
    expect(isWebRTCSupported()).toBe(false);
  });
});

describe('getBrowserInfo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('определяет Chrome', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120' });
    expect(getBrowserInfo()).toBe('Chrome');
  });

  it('определяет Firefox', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Firefox/120' });
    expect(getBrowserInfo()).toBe('Firefox');
  });

  it('определяет Edge', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Edg/120' });
    expect(getBrowserInfo()).toBe('Edge');
  });
});