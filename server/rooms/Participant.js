/**
 * Модель участника комнаты.
 * @typedef {Object} Participant
 * @property {string} id            — уникальный ID (socket.id), не отображается в UI
 * @property {string} name          — отображаемое имя (≤ 30 символов), может повторяться
 * @property {number} joinedAt      — timestamp входа (ms)
 * @property {boolean} audioEnabled — микрофон включён
 * @property {boolean} videoEnabled — камера включена
 */

/**
 * Создаёт нового участника.
 * @param {string} id
 * @param {string} name
 * @returns {Participant}
 */
export function createParticipant(id, name) {
  return {
    id,
    name,
    joinedAt: Date.now(),
    audioEnabled: true,
    videoEnabled: true,
  };
}