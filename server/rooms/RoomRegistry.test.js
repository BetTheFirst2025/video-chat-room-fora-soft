import { describe, it, expect, beforeEach } from 'vitest';
import { RoomRegistry } from './RoomRegistry.js';
import { createParticipant } from './Participant.js';
import { config } from '../config.js';

describe('RoomRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new RoomRegistry();
  });

  describe('getOrCreate', () => {
    it('создаёт новую комнату', () => {
      const room = registry.getOrCreate('room-1');
      expect(room).toBeInstanceOf(Object);
      expect(room.id).toBe('room-1');
      expect(registry.size()).toBe(1);
    });

    it('возвращает ту же комнату при повторном вызове', () => {
      const r1 = registry.getOrCreate('room-1');
      const r2 = registry.getOrCreate('room-1');
      expect(r1).toBe(r2);
      expect(registry.size()).toBe(1);
    });

    it('создаёт разные комнаты для разных id', () => {
      registry.getOrCreate('room-1');
      registry.getOrCreate('room-2');
      expect(registry.size()).toBe(2);
    });
  });

  describe('get / has', () => {
    it('get возвращает undefined для несуществующей', () => {
      expect(registry.get('nope')).toBeUndefined();
    });

    it('has возвращает true/false корректно', () => {
      registry.getOrCreate('room-1');
      expect(registry.has('room-1')).toBe(true);
      expect(registry.has('nope')).toBe(false);
    });
  });

  describe('tryJoin', () => {
    it('добавляет первого участника', () => {
      const p = createParticipant('sock_1', 'Алекс');
      const result = registry.tryJoin('room-1', p);
      expect(result.ok).toBe(true);
      expect(result.room.participants.size).toBe(1);
    });

    it('добавляет до MAX_PARTICIPANTS', () => {
      for (let i = 0; i < config.MAX_PARTICIPANTS; i++) {
        const result = registry.tryJoin('room-1', createParticipant(`sock_${i}`, `U${i}`));
        expect(result.ok).toBe(true);
      }
      expect(registry.get('room-1').participants.size).toBe(config.MAX_PARTICIPANTS);
    });

    it('отклоняет 5-го участника с ROOM_FULL', () => {
      for (let i = 0; i < config.MAX_PARTICIPANTS; i++) {
        registry.tryJoin('room-1', createParticipant(`sock_${i}`, `U${i}`));
      }
      const result = registry.tryJoin('room-1', createParticipant('sock_extra', 'Extra'));
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('ROOM_FULL');
      expect(registry.get('room-1').participants.size).toBe(config.MAX_PARTICIPANTS);
    });

    it('атомарность: одновременная гонка за последний слот', () => {
      // Заполняем 3 слота (MAX=4)
      for (let i = 0; i < config.MAX_PARTICIPANTS - 1; i++) {
        registry.tryJoin('room-1', createParticipant(`sock_${i}`, `U${i}`));
      }
      // Двое "одновременно" пытаются занять 4-й слот
      const r1 = registry.tryJoin('room-1', createParticipant('sock_a', 'A'));
      const r2 = registry.tryJoin('room-1', createParticipant('sock_b', 'B'));

      const okCount = [r1, r2].filter((r) => r.ok).length;
      const fullCount = [r1, r2].filter((r) => !r.ok && r.reason === 'ROOM_FULL').length;

      expect(okCount).toBe(1);
      expect(fullCount).toBe(1);
      expect(registry.get('room-1').participants.size).toBe(config.MAX_PARTICIPANTS);
    });

    it('создаёт комнату при первом join', () => {
      expect(registry.has('new-room')).toBe(false);
      registry.tryJoin('new-room', createParticipant('sock_1', 'A'));
      expect(registry.has('new-room')).toBe(true);
    });
  });

  describe('leave', () => {
    it('удаляет участника из непустой комнаты', () => {
      registry.tryJoin('room-1', createParticipant('sock_1', 'A'));
      registry.tryJoin('room-1', createParticipant('sock_2', 'B'));
      const removed = registry.leave('room-1', 'sock_1');
      expect(removed).toBe(true);
      expect(registry.get('room-1').participants.size).toBe(1);
    });

    it('удаляет комнату, когда уходит последний', () => {
      registry.tryJoin('room-1', createParticipant('sock_1', 'A'));
      registry.leave('room-1', 'sock_1');
      expect(registry.has('room-1')).toBe(false);
      expect(registry.size()).toBe(0);
    });

    it('возвращает false для несуществующей комнаты', () => {
      expect(registry.leave('nope', 'sock_1')).toBe(false);
    });

    it('возвращает false для несуществующего участника', () => {
      registry.tryJoin('room-1', createParticipant('sock_1', 'A'));
      expect(registry.leave('room-1', 'nope')).toBe(false);
    });
  });

  describe('delete', () => {
    it('удаляет существующую комнату', () => {
      registry.getOrCreate('room-1');
      expect(registry.delete('room-1')).toBe(true);
      expect(registry.has('room-1')).toBe(false);
    });

    it('возвращает false для несуществующей', () => {
      expect(registry.delete('nope')).toBe(false);
    });
  });
});