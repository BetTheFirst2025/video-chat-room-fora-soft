import { describe, it, expect } from 'vitest';

describe('client test setup', () => {
  it('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('jsdom environment is available', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});