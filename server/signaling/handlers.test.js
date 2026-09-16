import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { RoomRegistry } from '../rooms/RoomRegistry.js';
import { registerHandlers } from './handlers.js';
import { config } from '../config.js';

describe('handlers (integration)', () => {
  let httpServer;
  let ioServer;
  let registry;
  let port;
  let clients = [];

  beforeAll(async () => {
    httpServer = createServer();
    ioServer = new Server(httpServer);
    registry = new RoomRegistry();

    ioServer.on('connection', (socket) => {
      registerHandlers(ioServer, socket, registry);
    });

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const c of clients) c.close();
    await new Promise((resolve) => ioServer.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
  });

  beforeEach(() => {
    registry.rooms.clear();
    clients = [];
  });

  /**
   * Хелпер: создать клиент и дождаться connect.
   */
  function connect() {
    return new Promise((resolve) => {
      const c = ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      clients.push(c);
      c.on('connect', () => resolve(c));
    });
  }

  /**
   * Хелпер: join с ack.
   */
  function join(client, roomId, name) {
    return new Promise((resolve) => {
      client.emit('room:join', { roomId, name }, resolve);
    });
  }

  /**
   * Хелпер: подождать событие.
   */
  function waitFor(client, event) {
    return new Promise((resolve) => {
      client.once(event, resolve);
    });
  }

  // ============================================================
  // room:join / disconnect
  // ============================================================

  it('первый участник успешно входит', async () => {
    const c1 = await connect();
    const res = await join(c1, 'room-1', 'Алекс');

    expect(res.ok).toBe(true);
    expect(res.selfId).toBe(c1.id);
    expect(res.participants).toHaveLength(1);
    expect(res.participants[0].name).toBe('Алекс');
    expect(res.history).toHaveLength(1);
    expect(res.history[0].kind).toBe('system');
    expect(res.history[0].text).toContain('Алекс присоединился');
  });

  it('отклоняет невалидный roomId', async () => {
    const c1 = await connect();
    const res = await join(c1, 'x', 'Алекс'); // короткий
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_ROOM');
  });

  it('отклоняет пустое имя', async () => {
    const c1 = await connect();
    const res = await join(c1, 'room-1', '   ');
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_NAME');
  });

  it('второй участник видит первого', async () => {
    const c1 = await connect();
    await join(c1, 'room-1', 'Алекс');

    const c2 = await connect();
    const res = await join(c2, 'room-1', 'Мария');

    expect(res.ok).toBe(true);
    expect(res.participants).toHaveLength(2);
    const names = res.participants.map((p) => p.name);
    expect(names).toContain('Алекс');
    expect(names).toContain('Мария');
    // История: системное о входе Алекса + системное о входе Марии
    expect(res.history).toHaveLength(2);
  });

  it('первый получает room:participant-joined при входе второго', async () => {
    const c1 = await connect();
    await join(c1, 'room-1', 'Алекс');

    const joinedPromise = waitFor(c1, 'room:participant-joined');

    const c2 = await connect();
    await join(c2, 'room-1', 'Мария');

    const evt = await joinedPromise;
    expect(evt.participant.name).toBe('Мария');
    expect(evt.participant.id).toBe(c2.id);
  });

  it('5-й участник получает ROOM_FULL', async () => {
    const max = config.MAX_PARTICIPANTS;
    for (let i = 0; i < max; i++) {
      const c = await connect();
      const res = await join(c, 'room-full', `U${i}`);
      expect(res.ok).toBe(true);
    }

    const cExtra = await connect();
    const res = await join(cExtra, 'room-full', 'Extra');
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ROOM_FULL');
  });

  it('отклоняет повторный join с того же сокета', async () => {
    const c1 = await connect();
    const r1 = await join(c1, 'room-1', 'Алекс');
    expect(r1.ok).toBe(true);

    const r2 = await join(c1, 'room-1', 'Алекс2');
    expect(r2.ok).toBe(false);
    expect(r2.code).toBe('ALREADY_JOINED');
  });

  it('при disconnect остальные получают room:participant-left', async () => {
    const c1 = await connect();
    await join(c1, 'room-1', 'Алекс');
    const c2 = await connect();
    await join(c2, 'room-1', 'Мария');

    // Сохраняем ID ДО закрытия — после close() c2.id станет undefined
    const c2Id = c2.id;

    const leftPromise = waitFor(c1, 'room:participant-left');
    c2.close();

    const evt = await leftPromise;
    expect(evt.name).toBe('Мария');
    expect(evt.participantId).toBe(c2Id);
  });

  it('комната удаляется, когда уходит последний', async () => {
    const c1 = await connect();
    await join(c1, 'room-solo', 'Алекс');
    expect(registry.has('room-solo')).toBe(true);

    c1.close();
    // Дать серверу время обработать disconnect
    await new Promise((r) => setTimeout(r, 100));

    expect(registry.has('room-solo')).toBe(false);
  });

  // ============================================================
  // signal:offer / signal:answer / signal:ice
  // ============================================================

  describe('signal:offer/answer/ice', () => {
    it('signal:offer пробрасывается адресату с полем from', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      const offerPromise = waitFor(c2, 'signal:offer');
      const sdp = { type: 'offer', sdp: 'v=0...' };
      c1.emit('signal:offer', { to: c2.id, sdp });

      const evt = await offerPromise;
      expect(evt.from).toBe(c1.id);
      expect(evt.sdp).toEqual(sdp);
      expect(evt.to).toBeUndefined();
    });

    it('signal:answer пробрасывается адресату', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      const answerPromise = waitFor(c1, 'signal:answer');
      const sdp = { type: 'answer', sdp: 'v=0...' };
      c2.emit('signal:answer', { to: c1.id, sdp });

      const evt = await answerPromise;
      expect(evt.from).toBe(c2.id);
      expect(evt.sdp).toEqual(sdp);
    });

    it('signal:ice пробрасывается адресату', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      const icePromise = waitFor(c2, 'signal:ice');
      const candidate = { candidate: 'candidate:...', sdpMid: '0', sdpMLineIndex: 0 };
      c1.emit('signal:ice', { to: c2.id, candidate });

      const evt = await icePromise;
      expect(evt.from).toBe(c1.id);
      expect(evt.candidate).toEqual(candidate);
    });

    it('игнорирует signal, если отправитель не в комнате', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c2, 'room-1', 'Мария');
      // c1 НЕ входит в комнату

      let received = false;
      c2.on('signal:offer', () => {
        received = true;
      });
      c1.emit('signal:offer', { to: c2.id, sdp: {} });

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });

    it('игнорирует signal, если получатель не в комнате', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      // c2 НЕ входит в комнату

      let received = false;
      c2.on('signal:offer', () => {
        received = true;
      });
      c1.emit('signal:offer', { to: c2.id, sdp: {} });

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });

    it('игнорирует signal самому себе', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      let received = false;
      c1.on('signal:offer', () => {
        received = true;
      });
      c1.emit('signal:offer', { to: c1.id, sdp: {} });

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });

    it('игнорирует signal с невалидным to', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      let received = false;
      c1.on('signal:offer', () => {
        received = true;
      });
      c1.emit('signal:offer', { to: 123, sdp: {} });
      c1.emit('signal:offer', { sdp: {} }); // без to
      c1.emit('signal:offer', null);

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });
  });
});