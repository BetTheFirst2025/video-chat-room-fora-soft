import { useCallback, useEffect, useRef, useState } from 'react';
import { rtcConfig } from '../lib/rtcConfig.js';

/**
 * Управляет RTCPeerConnection для каждого пира в комнате (mesh).
 *
 * @param {object} options
 * @param {import('socket.io-client').Socket | null} options.socket
 * @param {MediaStream | null} options.localStream
 * @param {Array<{ id: string }>} options.participants
 * @param {string | null} options.selfId
 * @param {(event: string, payload: object) => void} options.sendSignal
 * @returns {{
 *   remoteStreams: Map<string, MediaStream>,
 *   connectionStates: Map<string, RTCPeerConnectionState>,
 * }}
 */
export function useMesh({ socket, localStream, participants, selfId, sendSignal }) {
  /** @type {Map<string, RTCPeerConnection>} */
  const pcsRef = useRef(new Map());

  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [connectionStates, setConnectionStates] = useState(new Map());

  // ============================================================
  // createPc — создаёт RTCPeerConnection для конкретного пира
  // ============================================================
  const createPc = useCallback(
    (peerId) => {
      if (!localStream) return null;
      if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId);

      const pc = new RTCPeerConnection(rtcConfig);

      // Добавляем локальные треки
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }

      // Входящие треки пира → сохраняем поток
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerId, stream);
          return next;
        });
      };

      // ICE-кандидаты → отправляем пиру через сигналинг
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          sendSignal('signal:ice', {
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Отслеживаем состояние соединения (для UI)
      pc.onconnectionstatechange = () => {
        setConnectionStates((prev) => {
          const next = new Map(prev);
          next.set(peerId, pc.connectionState);
          return next;
        });
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    },
    [localStream, socket, sendSignal]
  );

  // ============================================================
  // closePc — закрывает соединение с пиром
  // ============================================================
  const closePc = useCallback((peerId) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    setRemoteStreams((prev) => {
      if (!prev.has(peerId)) return prev;
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
    setConnectionStates((prev) => {
      if (!prev.has(peerId)) return prev;
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  // ============================================================
  // closeAll — при размонтировании
  // ============================================================
  const closeAll = useCallback(() => {
    for (const pc of pcsRef.current.values()) pc.close();
    pcsRef.current.clear();
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
  }, []);

  // ============================================================
  // React на изменения состава участников:
  // при уходе пира — закрываем PC
  // ============================================================
  useEffect(() => {
    const currentPeerIds = new Set(
      participants.filter((p) => p.id !== selfId).map((p) => p.id)
    );
    for (const peerId of pcsRef.current.keys()) {
      if (!currentPeerIds.has(peerId)) {
        closePc(peerId);
      }
    }
  }, [participants, selfId, closePc]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      closeAll();
    };
  }, [closeAll]);

  return {
    remoteStreams,
    connectionStates,
    // для задачи 28:
    _createPc: createPc,
    _closePc: closePc,
    _closeAll: closeAll,
    _pcsRef: pcsRef,
  };
}