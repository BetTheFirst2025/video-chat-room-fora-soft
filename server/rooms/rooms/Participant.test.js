import { describe, it, expect } from 'vitest';
import { createParticipant } from './Participant.js';

describe('createParticipant', () => {
  it('создаёт участника с правильными полями', () => {
    const p = createParticipant('sock_1', 'Алекс');
    expect(p.id).toBe('sock_1');
    expect(p.name).toBe('Алекс');
    expect(typeof p.joinedAt).toBe('number');
    expect(p.audioEnabled).toBe(true);
    expect(p.videoEnabled).toBe(true);
  });

  it('joinedAt — близко к текущему времени', () => {
    const before = Date.now();
    const p = createParticipant('sock_2', 'Мария');
    const after = Date.now();
    expect(p.joinedAt).toBeGreaterThanOrEqual(before);
    expect(p.joinedAt).toBeLessThanOrEqual(after);
  });

  it('по умолчанию audio и video включены', () => {
    const p = createParticipant('sock_3', 'Иван');
    expect(p.audioEnabled).toBe(true);
    expect(p.videoEnabled).toBe(true);
  });
});