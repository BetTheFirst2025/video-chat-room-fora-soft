import { describe, it, expect } from 'vitest';
import { rtcConfig } from './rtcConfig.js';

describe('rtcConfig', () => {
  it('содержит iceServers', () => {
    expect(rtcConfig).toHaveProperty('iceServers');
    expect(Array.isArray(rtcConfig.iceServers)).toBe(true);
    expect(rtcConfig.iceServers.length).toBeGreaterThan(0);
  });

  it('использует Google STUN', () => {
    const urls = rtcConfig.iceServers.map((s) => s.urls);
    expect(urls.some((u) => u.includes('stun.l.google.com'))).toBe(true);
  });

  it('не содержит TURN (по PRD)', () => {
    const urls = rtcConfig.iceServers.map((s) => s.urls);
    expect(urls.every((u) => !u.includes('turn:'))).toBe(true);
  });
});