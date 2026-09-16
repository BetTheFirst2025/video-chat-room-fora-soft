import { Room } from './Room.js';


/**
 * In-memory реестр комнат.
 *
 * Атомарность проверки лимита обеспечивается тем, что `tryJoin`
 * синхронен: проверка и вставка выполняются в одном tick event loop
 * без `await` между ними. Это ключевой приём для US-5.
 */
export class RoomRegistry {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  /**
   * Возвращает комнату по id или undefined.
   * @param {string} roomId
   * @returns {Room | undefined}
   */
  get(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Возвращает существующую комнату или создаёт новую.
   * @param {string} roomId
   * @returns {Room}
   */
  getOrCreate(roomId) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Room(roomId);
      this.rooms.set(roomId, room);
    }
    return room;
  }

  /**
   * Атомарно пытается добавить участника в комнату.
   * Проверка лимита и вставка — синхронно, в одном tick.
   *
   * @param {string} roomId
   * @param {import('./Participant.js').Participant} participant
   * @returns {{ ok: true, room: Room } | { ok: false, reason: 'ROOM_FULL' }}
   */
  tryJoin(roomId, participant) {
    const room = this.getOrCreate(roomId);

    // ВАЖНО: без await между isFull() и add()
    if (room.isFull()) {
      // Если комната была создана только что и уже полна — теоретически
      // невозможно (только что созданная пуста), но оставим как защита.
      return { ok: false, reason: 'ROOM_FULL' };
    }

    room.add(participant);
    return { ok: true, room };
  }

  /**
   * Удаляет участника из комнаты. Если комната опустела — удаляет её.
   * @param {string} roomId
   * @param {string} participantId
   * @returns {boolean} — true, если участник был удалён
   */
  leave(roomId, participantId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.remove(participantId);
    if (room.isEmpty()) {
      this.rooms.delete(roomId);
    }
    return removed;
  }

  /**
   * Явно удаляет комнату (например, при выходе последнего участника).
   * @param {string} roomId
   * @returns {boolean}
   */
  delete(roomId) {
    return this.rooms.delete(roomId);
  }

  /**
   * Количество активных комнат (для тестов и мониторинга).
   * @returns {number}
   */
  size() {
    return this.rooms.size;
  }

  /**
   * Есть ли комната с таким id.
   * @param {string} roomId
   * @returns {boolean}
   */
  has(roomId) {
    return this.rooms.has(roomId);
  }
}