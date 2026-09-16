import { nanoid } from 'nanoid';

/**
 * Регулярное выражение для валидации roomId.
 * Разрешены: латиница, цифры, дефис, подчёркивание. Длина 6–32.
 */
export const ROOM_ID_REGEX = /^[A-Za-z0-9_-]{6,32}$/;

/**
 * Генерирует новый URL-safe идентификатор комнаты.
 * @returns {string} 10-символьная строка из [A-Za-z0-9_-].
 */
export function generateRoomId() {
  return nanoid(10);
}

/**
 * Проверяет, что строка — валидный roomId.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidRoomId(id) {
  return typeof id === 'string' && ROOM_ID_REGEX.test(id);
}