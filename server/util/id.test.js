import { describe, it, expect } from 'vitest';
import { generateRoomId, isValidRoomId, ROOM_ID_REGEX } from './id.js';

describe('generateRoomId', () => {
  it('возвращает строку длиной 10', () => {
    const id = generateRoomId();
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(10);
  });

  it('соответствует ROOM_ID_REGEX', () => {
    const id = generateRoomId();
    expect(ROOM_ID_REGEX.test(id)).toBe(true);
  });

  it('генерирует уникальные id (1000 вызовов)', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateRoomId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe('isValidRoomId', () => {
  it('принимает корректные id', () => {
    expect(isValidRoomId('a1b2c3d4e5')).toBe(true);
    expect(isValidRoomId('abc-123_XYZ')).toBe(true);
    expect(isValidRoomId('a'.repeat(32))).toBe(true);
    expect(isValidRoomId('a'.repeat(6))).toBe(true);
  });

  it('отклоняет слишком короткие', () => {
    expect(isValidRoomId('abc')).toBe(false);
    expect(isValidRoomId('a'.repeat(5))).toBe(false);
  });

  it('отклоняет слишком длинные', () => {
    expect(isValidRoomId('a'.repeat(33))).toBe(false);
  });

  it('отклоняет недопустимые символы', () => {
    expect(isValidRoomId('abc 123')).toBe(false); // пробел
    expect(isValidRoomId('abc@123')).toBe(false); // @
    expect(isValidRoomId('abc/123')).toBe(false); // /
    expect(isValidRoomId('abc.123')).toBe(false); // .
    expect(isValidRoomId('abc-кириллица')).toBe(false); // кириллица
  });

  it('отклоняет не-строки', () => {
    expect(isValidRoomId(null)).toBe(false);
    expect(isValidRoomId(undefined)).toBe(false);
    expect(isValidRoomId(123)).toBe(false);
    expect(isValidRoomId({})).toBe(false);
    expect(isValidRoomId([])).toBe(false);
  });

  it('отклоняет пустую строку', () => {
    expect(isValidRoomId('')).toBe(false);
  });
});

describe('ROOM_ID_REGEX', () => {
  it('является регулярным выражением', () => {
    expect(ROOM_ID_REGEX).toBeInstanceOf(RegExp);
  });
});