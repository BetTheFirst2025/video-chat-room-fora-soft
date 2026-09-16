import { describe, it, expect, beforeEach } from 'vitest';
import { Room } from './Room.js';
import { createParticipant } from './Participant.js';
import { config } from '../config.js';

describe('Room', () => {
  let room;

  beforeEach(() => {
    room = new Room('test-room-1');
  });

  it('создаётся с правильными полями', () => {
    expect(room.id).toBe('test-room-1');
    expect(typeof room.createdAt).toBe('number');
    expect(room.participants.size).toBe(0);
    expect(room.messages).toEqual([]);
  });

  describe('add / remove', () => {
    it('добавляет участника', () => {
      const p = createParticipant('sock_1', 'Алекс');
      room.add(p);
      expect(room.participants.size).toBe(1);
      expect(room.participants.get('sock_1')).toBe(p);
    });

    it('удаляет участника', () => {
      const p = createParticipant('sock_1', 'Алекс');
      room.add(p);
      const removed = room.remove('sock_1');
      expect(removed).toBe(true);
      expect(room.participants.size).toBe(0);
    });

    it('remove возвращает false для несуществующего', () => {
      expect(room.remove('nope')).toBe(false);
    });
  });

  describe('isFull', () => {
    it('false при 0 участниках', () => {
      expect(room.isFull()).toBe(false);
    });

    it('true при MAX_PARTICIPANTS', () => {
      for (let i = 0; i < config.MAX_PARTICIPANTS; i++) {
        room.add(createParticipant(`sock_${i}`, `User ${i}`));
      }
      expect(room.isFull()).toBe(true);
    });
  });

  describe('peersOf', () => {
    it('возвращает всех, кроме указанного', () => {
      room.add(createParticipant('a', 'A'));
      room.add(createParticipant('b', 'B'));
      room.add(createParticipant('c', 'C'));
      const peers = room.peersOf('b');
      expect(peers).toEqual(expect.arrayContaining(['a', 'c']));
      expect(peers).not.toContain('b');
    });

    it('пустой массив, если один участник', () => {
      room.add(createParticipant('a', 'A'));
      expect(room.peersOf('a')).toEqual([]);
    });
  });

  describe('addMessage', () => {
    it('добавляет сообщение', () => {
      const msg = { id: 'm1', kind: 'user', text: 'hi', ts: Date.now() };
      room.addMessage(msg);
      expect(room.messages).toHaveLength(1);
      expect(room.messages[0]).toBe(msg);
    });

    it('обрезает старые сообщения при превышении лимита', () => {
      const limit = config.MAX_MESSAGES_PER_ROOM;
      for (let i = 0; i < limit + 10; i++) {
        room.addMessage({ id: `m${i}`, kind: 'system', text: `msg ${i}`, ts: Date.now() });
      }
      expect(room.messages).toHaveLength(limit);
      // Первое сообщение — то, что было добавлено 11-м (первые 10 обрезаны)
      expect(room.messages[0].id).toBe('m10');
    });
  });

  describe('participantsList', () => {
    it('возвращает массив участников', () => {
      const p1 = createParticipant('a', 'A');
      const p2 = createParticipant('b', 'B');
      room.add(p1);
      room.add(p2);
      const list = room.participantsList();
      expect(list).toHaveLength(2);
      expect(list).toContain(p1);
      expect(list).toContain(p2);
    });
  });

  describe('isEmpty', () => {
    it('true для пустой комнаты', () => {
      expect(room.isEmpty()).toBe(true);
    });

    it('false, если есть участники', () => {
      room.add(createParticipant('a', 'A'));
      expect(room.isEmpty()).toBe(false);
    });
  });
});