import { sanitizeName, sanitizeMessage, isValidRoomId } from './validate.js';
import { createParticipant } from '../rooms/Participant.js';
import { createSystemMessage, broadcastSystemMessage } from './systemMessage.js';

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
    if (session) {
      if (typeof ack === 'function') ack({ ok: false, code: 'ALREADY_JOINED' });
      return;
    }

    const roomId = payload?.roomId;
    const rawName = payload?.name;

    if (!isValidRoomId(roomId)) {
      if (typeof ack === 'function') ack({ ok: false, code: 'INVALID_ROOM' });
      socket.emit('room:error', { code: 'INVALID_ROOM' });
      return;
    }

    const name = sanitizeName(rawName);
    if (!name) {
      if (typeof ack === 'function') ack({ ok: false, code: 'INVALID_NAME' });
      socket.emit('room:error', { code: 'INVALID_NAME' });
      return;
    }

    const participant = createParticipant(socket.id, name);
    const result = registry.tryJoin(roomId, participant);

    if (!result.ok) {
      if (typeof ack === 'function') ack({ ok: false, code: result.reason });
      socket.emit('room:error', { code: result.reason });
      return;
    }

    const room = result.room;

    socket.join(roomId);
    session = { roomId, participantId: participant.id };

    // Системное сообщение о входе (добавляется до joinedPayload,
    // чтобы вошедший увидел его в history)
    const systemMsg = createSystemMessage(`${name} присоединился к комнате`);
    room.addMessage(systemMsg);

    const joinedPayload = {
      selfId: participant.id,
      roomId,
      participants: room.participantsList(),
      history: room.messages.slice(),
    };

    if (typeof ack === 'function') ack({ ok: true, ...joinedPayload });
    socket.emit('room:joined', joinedPayload);

    // Уведомляем остальных
    socket.to(roomId).emit('room:participant-joined', { participant });
    socket.to(roomId).emit('chat:message', systemMsg);

    console.log(
      `[room:join] ${name} (${socket.id}) → ${roomId} (${room.participants.size}/${room.isFull() ? 'FULL' : 'ok'})`
    );
  });

  // ============================================================
  // signal:offer / signal:answer / signal:ice
  // ============================================================
  function relaySignal(event, payload) {
    if (!session) return;
    const { roomId, participantId: fromId } = session;

    const to = payload?.to;
    if (typeof to !== 'string') return;

    const room = registry.get(roomId);
    if (!room) return;
    if (!room.participants.has(to)) return;
    if (to === fromId) return;

    const forwarded = { from: fromId, ...payload };
    delete forwarded.to;
    io.to(to).emit(event, forwarded);
  }

  socket.on('signal:offer', (payload) => relaySignal('signal:offer', payload));
  socket.on('signal:answer', (payload) => relaySignal('signal:answer', payload));
  socket.on('signal:ice', (payload) => relaySignal('signal:ice', payload));

  // ============================================================
  // chat:message
  // ============================================================
  socket.on('chat:message', (payload) => {
    if (!session) return;

    const { roomId, participantId } = session;
    const room = registry.get(roomId);
    if (!room) return;

    const participant = room.participants.get(participantId);
    if (!participant) return;

    const text = sanitizeMessage(payload?.text);
    if (!text) return;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'user',
      authorId: participantId,
      authorName: participant.name,
      text,
      ts: Date.now(),
    };

    room.addMessage(message);
    io.to(roomId).emit('chat:message', message);
  });

  // ============================================================
  // media:state
  // ============================================================
  socket.on('media:state', (payload) => {
    if (!session) return;

    const { roomId, participantId } = session;
    const room = registry.get(roomId);
    if (!room) return;

    const participant = room.participants.get(participantId);
    if (!participant) return;

    participant.audioEnabled = payload?.audioEnabled === true;
    participant.videoEnabled = payload?.videoEnabled === true;

    socket.to(roomId).emit('media:state', {
      participantId,
      audioEnabled: participant.audioEnabled,
      videoEnabled: participant.videoEnabled,
    });
  });

  // ============================================================
  // Общая логика выхода из комнаты
  // ============================================================
  function leaveRoom(reason) {
    if (!session) return;

    const { roomId, participantId } = session;
    const room = registry.get(roomId);

    session = null;

    if (!room) return;

    const participant = room.participants.get(participantId);
    const name = participant?.name ?? 'Участник';

    registry.leave(roomId, participantId);

    socket.to(roomId).emit('room:participant-left', { participantId, name });

    // Системное сообщение — только если комната ещё существует
    if (registry.has(roomId)) {
      broadcastSystemMessage(io, registry.get(roomId), `${name} покинул комнату`);
    } else {
      console.log(`[room] deleted (empty): ${roomId} (${reason})`);
    }

    console.log(`[room:leave] ${name} (${socket.id}) ← ${roomId} (${reason})`);
  }

  socket.on('room:leave', () => {
    socket.leave(session?.roomId);
    leaveRoom('explicit');
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    leaveRoom('disconnect');
  });
}