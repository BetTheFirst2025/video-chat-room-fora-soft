import { describe, it, expect, vi } from 'vitest';
import { createSystemMessage, broadcastSystemMessage } from './systemMessage.js';

describe('createSystemMessage', () => {
  it('возвращает сообщение с правильными полями', () => {
    const msg = createSystemMessage('тест');
    expect(msg.id).toMatch(/^sys-/);
    expect(msg.kind).toBe('system');
    expect(msg.text).toBe('тест');
    expect(typeof msg.ts).toBe('number');
  });

  it('генерирует уникальные id', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createSystemMessage('x').id);
    }
    expect(ids.size).toBe(100);
  });
});

describe('broadcastSystemMessage', () => {
  it('добавляет в комнату и broadcast\'ит', () => {
    const room = {
      id: 'room-1',
      addMessage: vi.fn(),
    };
    const io = {
      to: vi.fn(() => ({ emit: vi.fn() })),
    };

    const msg = broadcastSystemMessage(io, room, 'привет');

    expect(room.addMessage).toHaveBeenCalledOnce();
    expect(room.addMessage).toHaveBeenCalledWith(msg);
    expect(io.to).toHaveBeenCalledWith('room-1');
    expect(msg.text).toBe('привет');
  });
});