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

    it('игнорирует signal с to, содержащим недопустимые символы', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      let received = false;
      c2.on('signal:offer', () => { received = true; });

      c1.emit('signal:offer', { to: 'abc def', sdp: {} });           // пробел
      c1.emit('signal:offer', { to: '../evil', sdp: {} });           // слеш
      c1.emit('signal:offer', { to: 'a'.repeat(100), sdp: {} });     // слишком长
      c1.emit('signal:offer', { to: '', sdp: {} });                  // пустая

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });
  });

  // ============================================================
  // chat:message
  // ============================================================

  describe('chat:message', () => {
       it('broadcast сообщения всем в комнате, включая отправителя', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      let received1 = null;
      let received2 = null;
      c1.on('chat:message', (m) => { if (m.kind === 'user') received1 = m; });
      c2.on('chat:message', (m) => { if (m.kind === 'user') received2 = m; });

      c1.emit('chat:message', { text: 'Привет!' });
      await new Promise((r) => setTimeout(r, 100));

      expect(received1).not.toBeNull();
      expect(received2).not.toBeNull();
      expect(received1.id).toBe(received2.id);
      expect(received1.text).toBe('Привет!');
      expect(received1.authorName).toBe('Алекс');
      expect(received2.authorName).toBe('Алекс');
    });

    it('сообщение содержит id, kind, authorId, authorName, text, ts', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      let received = null;
      c1.on('chat:message', (m) => { if (m.kind === 'user') received = m; });

      c1.emit('chat:message', { text: 'Тест' });
      await new Promise((r) => setTimeout(r, 100));

      expect(received).not.toBeNull();
      expect(received.id).toMatch(/^msg-/);
      expect(received.kind).toBe('user');
      expect(received.authorId).toBe(c1.id);
      expect(received.authorName).toBe('Алекс');
      expect(received.text).toBe('Тест');
      expect(typeof received.ts).toBe('number');
    });

    it('игнорирует пустое сообщение', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      let received = null;
      c1.on('chat:message', (m) => { if (m.kind === 'user') received = m; });

      c1.emit('chat:message', { text: '   ' });
      c1.emit('chat:message', { text: '' });
      c1.emit('chat:message', {});
      c1.emit('chat:message', null);

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBeNull();
    });

    it('обрезает слишком длинное сообщение до MAX_MSG_LEN', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      let received = null;
      c1.on('chat:message', (m) => { if (m.kind === 'user') received = m; });

      const long = 'a'.repeat(config.MAX_MSG_LEN + 100);
      c1.emit('chat:message', { text: long });
      await new Promise((r) => setTimeout(r, 100));

      expect(received).not.toBeNull();
      expect(received.text).toHaveLength(config.MAX_MSG_LEN);
    });

    it('игнорирует сообщение от сокета, не вошедшего в комнату', async () => {
      const c1 = await connect();
      // c1 НЕ входит в комнату

      let received = null;
      c1.on('chat:message', (m) => { if (m.kind === 'user') received = m; });

      c1.emit('chat:message', { text: 'Привет' });
      await new Promise((r) => setTimeout(r, 100));

      expect(received).toBeNull();
    });

    it('сообщения накапливаются в history и видны позднему участнику', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      c1.emit('chat:message', { text: 'Первое' });
      await new Promise((r) => setTimeout(r, 50));
      c1.emit('chat:message', { text: 'Второе' });
      await new Promise((r) => setTimeout(r, 50));

      const c2 = await connect();
      const res = await join(c2, 'room-1', 'Мария');

      expect(res.history).toHaveLength(4); // system(Алекс) + Первое + Второе + system(Мария)
      const userMsgs = res.history.filter((m) => m.kind === 'user');
      expect(userMsgs.map((m) => m.text)).toEqual(['Первое', 'Второе']);
    });
  });

    // ============================================================
  // media:state
  // ============================================================

  describe('media:state', () => {
    it('broadcast остальным, но не отправителю', async () => {
      const c1 = await connect();
      const c2 = await connect();
      await join(c1, 'room-1', 'Алекс');
      await join(c2, 'room-1', 'Мария');

      let c1Received = null;
      let c2Received = null;
      c1.on('media:state', (m) => { c1Received = m; });
      c2.on('media:state', (m) => { c2Received = m; });

      c1.emit('media:state', { audioEnabled: false, videoEnabled: true });
      await new Promise((r) => setTimeout(r, 100));

      // c1 НЕ должен получить своё же событие
      expect(c1Received).toBeNull();
      // c2 должен получить
      expect(c2Received).not.toBeNull();
      expect(c2Received.participantId).toBe(c1.id);
      expect(c2Received.audioEnabled).toBe(false);
      expect(c2Received.videoEnabled).toBe(true);
    });

    it('обновляет participant.audioEnabled/videoEnabled', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      const room = registry.get('room-1');
      const participant = room.participants.get(c1.id);
      expect(participant.audioEnabled).toBe(true);
      expect(participant.videoEnabled).toBe(true);

      c1.emit('media:state', { audioEnabled: false, videoEnabled: false });
      await new Promise((r) => setTimeout(r, 50));

      expect(participant.audioEnabled).toBe(false);
      expect(participant.videoEnabled).toBe(false);
    });

    it('приводит мусор к false (не доверяем клиенту)', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');

      const room = registry.get('room-1');
      const participant = room.participants.get(c1.id);

      // Отправляем не-boolean значения
      c1.emit('media:state', { audioEnabled: 'yes', videoEnabled: 1 });
      await new Promise((r) => setTimeout(r, 50));

      expect(participant.audioEnabled).toBe(false);
      expect(participant.videoEnabled).toBe(false);
    });

    it('игнорирует media:state от сокета, не вошедшего в комнату', async () => {
      const c1 = await connect();
      // c1 НЕ входит в комнату

      let received = null;
      c1.on('media:state', (m) => { received = m; });

      c1.emit('media:state', { audioEnabled: false, videoEnabled: false });
      await new Promise((r) => setTimeout(r, 100));

      // Никакой комнаты — событие не должно разлетаться
      expect(received).toBeNull();
    });
  });

  // ============================================================
  // room:leave
  // ============================================================

  describe('room:leave', () => {
    it('удаляет участника и уведомляет остальных', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');
      const c2 = await connect();
      await join(c2, 'room-1', 'Мария');

      const leftPromise = waitFor(c1, 'room:participant-left');

      c2.emit('room:leave');
      const evt = await leftPromise;

      expect(evt.name).toBe('Мария');
      expect(evt.participantId).toBe(c2.id);
      expect(registry.get('room-1').participants.size).toBe(1);
    });

    it('после room:leave клиент может снова войти', async () => {
      const c1 = await connect();
      const r1 = await join(c1, 'room-1', 'Алекс');
      expect(r1.ok).toBe(true);

      c1.emit('room:leave');
      await new Promise((r) => setTimeout(r, 50));

      const r2 = await join(c1, 'room-1', 'Алекс2');
      expect(r2.ok).toBe(true);
    });

    it('room:leave без join — no-op, не падает', async () => {
      const c1 = await connect();
      c1.emit('room:leave');
      await new Promise((r) => setTimeout(r, 50));
      // Просто проверяем, что ничего не сломалось
      expect(registry.size()).toBe(0);
    });

    it('при явном выходе последнего комната удаляется', async () => {
      const c1 = await connect();
      await join(c1, 'room-solo', 'Алекс');
      expect(registry.has('room-solo')).toBe(true);

      c1.emit('room:leave');
      await new Promise((r) => setTimeout(r, 50));

      expect(registry.has('room-solo')).toBe(false);
    });

    it('системное сообщение «покинул комнату» добавляется в историю', async () => {
      const c1 = await connect();
      await join(c1, 'room-1', 'Алекс');
      const c2 = await connect();
      await join(c2, 'room-1', 'Мария');

      const msgPromise = new Promise((resolve) => {
        c1.on('chat:message', (m) => {
          if (m.kind === 'system' && m.text.includes('Мария покинул')) {
            resolve(m);
          }
        });
      });

      c2.emit('room:leave');
      const evt = await msgPromise;

      expect(evt.kind).toBe('system');
      expect(evt.text).toBe('Мария покинул комнату');
    });
  });

  it('первый участник НЕ получает chat:message о своём входе (нет дубликата)', async () => {
    const c1 = await connect();

    const chatMessages = [];
    c1.on('chat:message', (m) => chatMessages.push(m));

    const res = await join(c1, 'room-1', 'Алекс');

    // История содержит systemMsg
    expect(res.history).toHaveLength(1);
    expect(res.history[0].kind).toBe('system');

    // Но chat:message с этим же id НЕ приходит
    await new Promise((r) => setTimeout(r, 100));
    expect(chatMessages).toHaveLength(0);
  });
});