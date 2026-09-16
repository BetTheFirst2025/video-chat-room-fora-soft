import { config } from '../config.js';

/**
 * Разрешённые символы в имени: буквы (латиница + кириллица),
 * цифры, пробел, дефис, подчёркивание, точка.
 * Всё остальное — удаляется.
 */
const NAME_DISALLOWED_REGEX = /[^\p{L}\p{N}\s\-_.]/gu;

/**
 * Очищает и валидирует отображаемое имя.
 *
 * Шаги:
 *   1. Проверка типа (только string).
 *   2. trim.
 *   3. Удаление запрещённых символов.
 *   4. Схлопывание множественных пробелов в один.
 *   5. Обрезка до config.MAX_NAME_LEN.
 *
 * @param {unknown} raw
 * @returns {string | null} — очищенное имя или null, если после очистки пусто
 */
export function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;

  let name = raw.trim();
  if (!name) return null;

  name = name.replace(NAME_DISALLOWED_REGEX, '');
  name = name.replace(/\s+/g, ' ').trim();

  if (!name) return null;

  if (name.length > config.MAX_NAME_LEN) {
    name = name.slice(0, config.MAX_NAME_LEN);
  }

  return name;
}

/**
 * Очищает и валидирует текст сообщения.
 *
 * В отличие от имени, символы НЕ удаляются (сообщение может содержать
 * ссылки, эмодзи, разметку). XSS-защита — на клиенте (React экранирует).
 *
 * @param {unknown} raw
 * @returns {string | null} — очищенный текст или null, если пусто
 */
export function sanitizeMessage(raw) {
  if (typeof raw !== 'string') return null;

  let text = raw.trim();
  if (!text) return null;

  if (text.length > config.MAX_MSG_LEN) {
    text = text.slice(0, config.MAX_MSG_LEN);
  }

  return text;
}

/**
 * Проверяет, что строка — валидный roomId.
 * Формат: [A-Za-z0-9_-]{6,32}
 *
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidRoomId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{6,32}$/.test(id);
}