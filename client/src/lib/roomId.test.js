import { describe, it, expect } from 'vitest';
import { generateRoomId, isValidRoomId, ROOM_ID_REGEX } from './roomId.js';

describe('generateRoomId', () => {
  it('возвращает строку длиной 10', () => {
    expect(generateRoomId()).toHaveLength(10);
  });

  it('соответствует regex', () => {
    expect(ROOM_ID_REGEX.test(generateRoomId())).toBe(true);
  });

  it('генерирует уникальные id', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) ids.add(generateRoomId());
    expect(ids.size).toBe(1000);
  });
});

describe('isValidRoomId', () => {
  it('принимает корректные', () => {
    expect(isValidRoomId('a1b2c3d4e5')).toBe(true);
    expect(isValidRoomId('a'.repeat(6))).toBe(true);
    expect(isValidRoomId('a'.repeat(32))).toBe(true);
  });

  it('отклоняет некорректные', () => {
    expect(isValidRoomId('abc')).toBe(false);
    expect(isValidRoomId('a'.repeat(33))).toBe(false);
    expect(isValidRoomId('abc 123')).toBe(false);
    expect(isValidRoomId(null)).toBe(false);
    expect(isValidRoomId(123)).toBe(false);
  });
});