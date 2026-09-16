import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Хук для работы с Socket.io.
 *
 * @param {string | null} roomId — id комнаты (из URL)
 * @param {string | null} name   — отображаемое имя
 * @returns {{
 *   socket: import('socket.io-client').Socket | null,
 *   connected: boolean,
 *   error: { code: string, message?: string } | null,
 *   selfId: string | null,
 *   participants: Array<object>,
 *   messages: Array<object>,
 *   sendMessage: (text: string) => void,
 *   sendSignal: (event: 'signal:offer' | 'signal:answer' | 'signal:ice', payload: object) => void,
 *   sendMediaState: (state: { audioEnabled: boolean, videoEnabled: boolean }) => void,
 *   leaveRoom: () => void,
 * }}
 */
export function useSocket(roomId, name) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [selfId, setSelfId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!roomId || !name) return;

    // Создаём сокет (same-origin — прокси Vite перенаправит на :3000)
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: false, // без автопереподключения (PRD US-11)
    });
    socketRef.current = socket;

    // === connect / disconnect ===
    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      // Входим в комнату
      socket.emit('room:join', { roomId, name });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError({ code: 'SERVER_DOWN', message: err.message });
    });

    // === room:joined ===
    socket.on('room:joined', (payload) => {
      setSelfId(payload.selfId);
      setParticipants(payload.participants);
      setMessages(payload.history);
    });

    // === room:error ===
    socket.on('room:error', (payload) => {
      setError({ code: payload.code });
    });

    // === room:participant-joined ===
    socket.on('room:participant-joined', ({ participant }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    });

    // === room:participant-left ===
    socket.on('room:participant-left', ({ participantId }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    });

    // === chat:message ===
    socket.on('chat:message', (message) => {
    setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // === media:state ===
    socket.on('media:state', ({ participantId, audioEnabled, videoEnabled }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, audioEnabled, videoEnabled } : p
        )
      );
    });

    // Cleanup
    return () => {
      socket.emit('room:leave');
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, name]);

  // === Actions ===
  const sendMessage = useCallback((text) => {
    socketRef.current?.emit('chat:message', { text });
  }, []);

  const sendSignal = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const sendMediaState = useCallback((state) => {
    socketRef.current?.emit('media:state', state);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    socketRef.current?.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    selfId,
    participants,
    messages,
    sendMessage,
    sendSignal,
    sendMediaState,
    leaveRoom,
  };
}