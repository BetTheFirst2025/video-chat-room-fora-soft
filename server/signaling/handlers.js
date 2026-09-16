import { sanitizeName, isValidRoomId } from './validate.js';
import { createParticipant } from '../rooms/Participant.js';

/**
 * Регистрирует обработчики Socket.io для одного подключения.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../rooms/RoomRegistry.js').RoomRegistry} registry
 */
export function registerHandlers(io, socket, registry) {
  console.log(`[socket] connected: ${socket.id}`);

  /**
   * Текущее состояние сокета: в какой комнате он находится.
   * null — ещё не вошёл.
   * @type {{ roomId: string, participantId: string } | null}
   */
  let session = null;

  // ============================================================
  // room:join
  // ============================================================
  socket.on('room:join', (payload, ack) => {
    // Защита от повторного join с того же сокета
    if (session) {
      if (typeof ack === 'function') ack({ ok: false, code: 'ALREADY_JOINED' });
      return;
    }

    const roomId = payload?.roomId;
    const rawName = payload?.name;

    // Валидация roomId
    if (!isValidRoomId(roomId)) {
      if (typeof ack === 'function') ack({ ok: false, code: 'INVALID_ROOM' });
      socket.emit('room:error', { code: 'INVALID_ROOM' });
      return;
    }

    // Валидация имени
    const name = sanitizeName(rawName);
    if (!name) {
      if (typeof ack === 'function') ack({ ok: false, code: 'INVALID_NAME' });
      socket.emit('room:error', { code: 'INVALID_NAME' });
      return;
    }

    // Создаём участника
    const participant = createParticipant(socket.id, name);

    // Атомарная попытка входа
    const result = registry.tryJoin(roomId, participant);

    if (!result.ok) {
      if (typeof ack === 'function') ack({ ok: false, code: result.reason });
      socket.emit('room:error', { code: result.reason });
      return;
    }

    const room = result.room;

    // Подписываем сокет на комнату Socket.io
    socket.join(roomId);
    session = { roomId, participantId: participant.id };

    // Системное сообщение о входе
    const systemMsg = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'system',
      text: `${name} присоединился к комнате`,
      ts: Date.now(),
    };
    room.addMessage(systemMsg);

    // Ответ тому, кто вошёл: selfId, состав, история
    const joinedPayload = {
      selfId: participant.id,
      roomId,
      participants: room.participantsList(),
      history: room.messages.slice(),
    };

    if (typeof ack === 'function') ack({ ok: true, ...joinedPayload });
    socket.emit('room:joined', joinedPayload);

    // Уведомляем остальных
    socket.to(roomId).emit('room:participant-joined', {
      participant,
    });

    // Системное сообщение — всем в комнате
    io.to(roomId).emit('chat:message', systemMsg);

    console.log(`[room:join] ${name} (${socket.id}) → ${roomId} (${room.participants.size}/${room.isFull() ? 'FULL' : 'ok'})`);
  });

  // ============================================================
  // disconnect
  // ============================================================
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);

    if (!session) return;

    const { roomId, participantId } = session;
    const room = registry.get(roomId);
    if (!room) return;

    const participant = room.participants.get(participantId);
    const name = participant?.name ?? 'Участник';

    registry.leave(roomId, participantId);

    // Уведомляем остальных
    socket.to(roomId).emit('room:participant-left', {
      participantId,
      name,
    });

    // Системное сообщение — только если комната ещё существует
    if (registry.has(roomId)) {
      const systemMsg = {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'system',
        text: `${name} покинул комнату`,
        ts: Date.now(),
      };
      const remainingRoom = registry.get(roomId);
      remainingRoom.addMessage(systemMsg);
      io.to(roomId).emit('chat:message', systemMsg);
    } else {
      console.log(`[room] deleted (empty): ${roomId}`);
    }

    session = null;
  });
}