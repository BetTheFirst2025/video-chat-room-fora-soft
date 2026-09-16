import { config } from '../config.js';

/**
 * Модель комнаты: набор участников + история сообщений.
 * Живёт в памяти, пока в ней есть хотя бы один участник.
 */
export class Room {
  /**
   * @param {string} id — roomId (валидный, см. util/id.js)
   */
  constructor(id) {
    this.id = id;
    this.createdAt = Date.now();
    /** @type {Map<string, import('./Participant.js').Participant>} */
    this.participants = new Map();
    /** @type {Array<import('./types.js').Message>} */
    this.messages = [];
  }

  /**
   * Добавляет участника в комнату.
   * @param {import('./Participant.js').Participant} participant
   */
  add(participant) {
    this.participants.set(participant.id, participant);
  }

  /**
   * Удаляет участника по id.
   * @param {string} participantId
   * @returns {boolean} — true, если участник был удалён
   */
  remove(participantId) {
    return this.participants.delete(participantId);
  }

  /**
   * Проверяет, заполнена ли комната.
   * @returns {boolean}
   */
  isFull() {
    return this.participants.size >= config.MAX_PARTICIPANTS;
  }

  /**
   * Возвращает id всех участников, кроме указанного.
   * @param {string} excludeId
   * @returns {string[]}
   */
  peersOf(excludeId) {
    return [...this.participants.keys()].filter((id) => id !== excludeId);
  }

  /**
   * Добавляет сообщение в историю. Обрезает старые при превышении лимита.
   * @param {import('./types.js').Message} message
   */
  addMessage(message) {
    this.messages.push(message);
    if (this.messages.length > config.MAX_MESSAGES_PER_ROOM) {
      this.messages.splice(0, this.messages.length - config.MAX_MESSAGES_PER_ROOM);
    }
  }

  /**
   * Возвращает список участников как plain-объекты (для отправки по сети).
   * @returns {Array<import('./Participant.js').Participant>}
   */
  participantsList() {
    return [...this.participants.values()];
  }

  /**
   * Пуста ли комната.
   * @returns {boolean}
   */
  isEmpty() {
    return this.participants.size === 0;
  }
}