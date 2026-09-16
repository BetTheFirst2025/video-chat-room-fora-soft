import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket.js';

// Мокаем socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    id: 'mock-socket-id',
  };
  return {
    io: vi.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

import { io, __mockSocket as mockSocket } from 'socket.io-client';

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('не подключается, если нет roomId', () => {
    renderHook(() => useSocket(null, 'Алекс'));
    expect(io).not.toHaveBeenCalled();
  });

  it('не подключается, если нет name', () => {
    renderHook(() => useSocket('room-1', null));
    expect(io).not.toHaveBeenCalled();
  });

  it('подключается при наличии roomId и name', () => {
    renderHook(() => useSocket('room-1', 'Алекс'));
    expect(io).toHaveBeenCalledOnce();
  });

  it('регистрирует обработчики событий', () => {
    renderHook(() => useSocket('room-1', 'Алекс'));

    const events = mockSocket.on.mock.calls.map(([evt]) => evt);
    expect(events).toContain('connect');
    expect(events).toContain('disconnect');
    expect(events).toContain('connect_error');
    expect(events).toContain('room:joined');
    expect(events).toContain('room:error');
    expect(events).toContain('room:participant-joined');
    expect(events).toContain('room:participant-left');
    expect(events).toContain('chat:message');
    expect(events).toContain('media:state');
  });

  it('эмитит room:join на connect', () => {
    renderHook(() => useSocket('room-1', 'Алекс'));

    const connectHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'connect'
    )[1];
    act(() => connectHandler());

    expect(mockSocket.emit).toHaveBeenCalledWith('room:join', {
      roomId: 'room-1',
      name: 'Алекс',
    });
  });

  it('обновляет selfId/participants/messages на room:joined', () => {
    const { result } = renderHook(() => useSocket('room-1', 'Алекс'));

    const joinedHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'room:joined'
    )[1];

    act(() => {
      joinedHandler({
        selfId: 'sock-1',
        participants: [{ id: 'sock-1', name: 'Алекс' }],
        history: [{ id: 'm1', kind: 'system', text: 'hi', ts: 1 }],
      });
    });

    expect(result.current.selfId).toBe('sock-1');
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.messages).toHaveLength(1);
  });

  it('устанавливает error на room:error', () => {
    const { result } = renderHook(() => useSocket('room-1', 'Алекс'));

    const errorHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'room:error'
    )[1];

    act(() => errorHandler({ code: 'ROOM_FULL' }));
    expect(result.current.error).toEqual({ code: 'ROOM_FULL' });
  });

  it('добавляет нового участника на room:participant-joined', () => {
    const { result } = renderHook(() => useSocket('room-1', 'Алекс'));

    const joinHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'room:participant-joined'
    )[1];

    act(() => joinHandler({ participant: { id: 'sock-2', name: 'Мария' } }));
    expect(result.current.participants).toHaveLength(1);
  });

  it('удаляет участника на room:participant-left', () => {
    const { result } = renderHook(() => useSocket('room-1', 'Алекс'));

    // Сначала добавим
    const joinHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'room:participant-joined'
    )[1];
    act(() => joinHandler({ participant: { id: 'sock-2', name: 'Мария' } }));
    expect(result.current.participants).toHaveLength(1);

    // Потом удалим
    const leftHandler = mockSocket.on.mock.calls.find(
      ([evt]) => evt === 'room:participant-left'
    )[1];
    act(() => leftHandler({ participantId: 'sock-2' }));
    expect(result.current.participants).toHaveLength(0);
  });

  it('sendMessage эмитит chat:message', () => {
    const { result } = renderHook(() => useSocket('room-1', 'Алекс'));
    act(() => result.current.sendMessage('привет'));
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', {
      text: 'привет',
    });
  });
});