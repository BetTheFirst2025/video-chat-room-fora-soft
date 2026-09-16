import { describe, it, expect } from 'vitest';
import { sanitizeName, sanitizeMessage, isValidRoomId } from './validate.js';
import { config } from '../config.js';

describe('sanitizeName', () => {
  it('принимает простое имя', () => {
    expect(sanitizeName('Алекс')).toBe('Алекс');
  });

  it('обрезает пробелы в начале и конце', () => {
    expect(sanitizeName('  Алекс  ')).toBe('Алекс');
  });

  it('схлопывает множественные пробелы', () => {
    expect(sanitizeName('Алекс    Иванов')).toBe('Алекс Иванов');
  });

  it('принимает латиницу, цифры, дефис, подчёркивание, точку', () => {
    expect(sanitizeName('John_Doe-99.test')).toBe('John_Doe-99.test');
  });

  it('удаляет HTML-теги (XSS)', () => {
    expect(sanitizeName('<script>alert(1)</script>')).toBe('scriptalert1script');
  });

  it('удаляет @, #, $ и прочие спецсимволы', () => {
    expect(sanitizeName('a@b#c$d%e')).toBe('abcde');
  });

  it('обрезает до MAX_NAME_LEN', () => {
    const long = 'a'.repeat(50);
    expect(sanitizeName(long)).toHaveLength(config.MAX_NAME_LEN);
  });

  it('сохраняет кириллицу', () => {
    expect(sanitizeName('Мария Ивановна')).toBe('Мария Ивановна');
  });

  it('возвращает null для пустой строки', () => {
    expect(sanitizeName('')).toBeNull();
    expect(sanitizeName('   ')).toBeNull();
  });

  it('возвращает null для не-строки', () => {
    expect(sanitizeName(null)).toBeNull();
    expect(sanitizeName(undefined)).toBeNull();
    expect(sanitizeName(123)).toBeNull();
    expect(sanitizeName({})).toBeNull();
    expect(sanitizeName([])).toBeNull();
  });

  it('возвращает null, если после очистки ничего не осталось', () => {
    expect(sanitizeName('@@@@')).toBeNull();
    expect(sanitizeName('###')).toBeNull();
  });
});

describe('sanitizeMessage', () => {
  it('принимает простое сообщение', () => {
    expect(sanitizeMessage('Привет!')).toBe('Привет!');
  });

  it('обрезает пробелы', () => {
    expect(sanitizeMessage('  Привет!  ')).toBe('Привет!');
  });

  it('обрезает до MAX_MSG_LEN', () => {
    const long = 'a'.repeat(config.MAX_MSG_LEN + 100);
    expect(sanitizeMessage(long)).toHaveLength(config.MAX_MSG_LEN);
  });

  it('НЕ удаляет символы (сообщение может содержать что угодно)', () => {
    const msg = '<script>alert(1)</script> https://example.com 🎉';
    expect(sanitizeMessage(msg)).toBe(msg);
  });

  it('возвращает null для пустой строки', () => {
    expect(sanitizeMessage('')).toBeNull();
    expect(sanitizeMessage('   ')).toBeNull();
  });

  it('возвращает null для не-строки', () => {
    expect(sanitizeMessage(null)).toBeNull();
    expect(sanitizeMessage(undefined)).toBeNull();
    expect(sanitizeMessage(42)).toBeNull();
  });
});

describe('isValidRoomId', () => {
  it('принимает корректные id', () => {
    expect(isValidRoomId('a1b2c3d4e5')).toBe(true);
    expect(isValidRoomId('abc-123_XYZ')).toBe(true);
    expect(isValidRoomId('a'.repeat(32))).toBe(true);
    expect(isValidRoomId('a'.repeat(6))).toBe(true);
  });

  it('отклоняет короткие/длинные', () => {
    expect(isValidRoomId('abc')).toBe(false);
    expect(isValidRoomId('a'.repeat(33))).toBe(false);
  });

  it('отклоняет недопустимые символы', () => {
    expect(isValidRoomId('abc 123')).toBe(false);
    expect(isValidRoomId('abc@123')).toBe(false);
    expect(isValidRoomId('abc/123')).toBe(false);
    expect(isValidRoomId('abc.123')).toBe(false);
    expect(isValidRoomId('abc-кириллица')).toBe(false);
  });

  it('отклоняет не-строки', () => {
    expect(isValidRoomId(null)).toBe(false);
    expect(isValidRoomId(undefined)).toBe(false);
    expect(isValidRoomId(123)).toBe(false);
    expect(isValidRoomId({})).toBe(false);
  });
});