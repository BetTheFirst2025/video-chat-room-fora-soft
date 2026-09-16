/**
 * Генерирует новый roomId (URL-safe, 10 символов).
 * Использует crypto.getRandomValues — доступен во всех современных браузерах.
 *
 * @returns {string}
 */
export function generateRoomId() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}

/**
 * Регулярка для валидации roomId (должна совпадать с серверной).
 */
export const ROOM_ID_REGEX = /^[A-Za-z0-9_-]{6,32}$/;

/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidRoomId(id) {
  return typeof id === 'string' && ROOM_ID_REGEX.test(id);
}