/**
 * Создаёт объект системного сообщения.
 *
 * @param {string} text
 * @returns {{
 *   id: string,
 *   kind: 'system',
 *   text: string,
 *   ts: number
 * }}
 */
export function createSystemMessage(text) {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'system',
    text,
    ts: Date.now(),
  };
}

/**
 * Добавляет системное сообщение в комнату и broadcast'ит его.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/Room.js').Room} room
 * @param {string} text
 * @returns {object} — созданное сообщение
 */
export function broadcastSystemMessage(io, room, text) {
  const message = createSystemMessage(text);
  room.addMessage(message);
  io.to(room.id).emit('chat:message', message);
  return message;
}