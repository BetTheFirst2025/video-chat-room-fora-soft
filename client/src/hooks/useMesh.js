import { useCallback, useEffect, useRef, useState } from 'react';
import { rtcConfig } from '../lib/rtcConfig.js';

/**
 * Управляет RTCPeerConnection для каждого пира в комнате (mesh).
 *
 * Политика glare (TDD §7.2): оффер инициирует только вновь вошедший.
 * Существующие участники только отвечают.
 *
 * @param {object} options
 * @param {import('socket.io-client').Socket | null} options.socket
 * @param {MediaStream | null} options.localStream
 * @param {Array<{ id: string }>} options.participants
 * @param {string | null} options.selfId
 * @param {(event: string, payload: object) => void} options.sendSignal
 */
export function useMesh({ socket, localStream, participants, selfId, sendSignal }) {
  /** @type {Map<string, RTCPeerConnection>} */
  const pcsRef = useRef(new Map());

  /** @type {Map<string, RTCIceCandidateInit[]>} — буфер ICE до setRemoteDescription */
  const pendingIceRef = useRef(new Map());

  /** Set из peerId, для которых МЫ инициатор (glare-политика) */
  const initiatorRef = useRef(new Set());

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

      // Входящие треки
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

      // Состояние соединения
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
    pendingIceRef.current.delete(peerId);
    initiatorRef.current.delete(peerId);
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

  const closeAll = useCallback(() => {
    for (const pc of pcsRef.current.values()) pc.close();
    pcsRef.current.clear();
    pendingIceRef.current.clear();
    initiatorRef.current.clear();
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
  }, []);

  // ============================================================
  // Инициировать offer к пиру (мы — новичок)
  // ============================================================
  const initiateOffer = useCallback(
    async (peerId) => {
      const pc = createPc(peerId);
      if (!pc) return;
      if (initiatorRef.current.has(peerId)) return; // уже инициировали
      initiatorRef.current.add(peerId);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('signal:offer', {
          to: peerId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('[useMesh] initiateOffer failed:', err);
      }
    },
    [createPc, sendSignal]
  );

  // ============================================================
  // Обработка входящих сигнальных событий
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    const onOffer = async ({ from, sdp }) => {
      const pc = createPc(from);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Применяем буферизованные ICE
        const pending = pendingIceRef.current.get(from) || [];
        for (const c of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            console.warn('[useMesh] failed to add buffered ICE:', err);
          }
        }
        pendingIceRef.current.delete(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal('signal:answer', {
          to: from,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('[useMesh] onOffer failed:', err);
      }
    };

    const onAnswer = async ({ from, sdp }) => {
      const pc = pcsRef.current.get(from);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Применяем буферизованные ICE
        const pending = pendingIceRef.current.get(from) || [];
        for (const c of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            console.warn('[useMesh] failed to add buffered ICE (answer):', err);
          }
        }
        pendingIceRef.current.delete(from);
      } catch (err) {
        console.error('[useMesh] onAnswer failed:', err);
      }
    };

    const onIce = async ({ from, candidate }) => {
      const pc = pcsRef.current.get(from);
      if (!pc) return;

      // Если remoteDescription ещё не установлен — буферизуем
      if (!pc.remoteDescription || !pc.remoteDescription.type) {
        const buf = pendingIceRef.current.get(from) || [];
        buf.push(candidate);
        pendingIceRef.current.set(from, buf);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[useMesh] addIceCandidate failed:', err);
      }
    };

    socket.on('signal:offer', onOffer);
    socket.on('signal:answer', onAnswer);
    socket.on('signal:ice', onIce);

    return () => {
      socket.off('signal:offer', onOffer);
      socket.off('signal:answer', onAnswer);
      socket.off('signal:ice', onIce);
    };
  }, [socket, createPc, sendSignal]);

  // ============================================================
  // При изменении participants:
  //  - ушёл пир → closePc
  //  - новичок (мы) → initiateOffer к каждому существующему
  // ============================================================
  useEffect(() => {
    if (!selfId || !localStream || !socket) return;

    const others = participants.filter((p) => p.id !== selfId);
    const otherIds = new Set(others.map((p) => p.id));

    // Закрываем PC для ушедших
    for (const peerId of pcsRef.current.keys()) {
      if (!otherIds.has(peerId)) closePc(peerId);
    }

    // Для каждого существующего пира, с которым ещё нет PC → мы новичок,
    // инициируем offer (glare-политика: только новичок инициирует)
    for (const peer of others) {
      if (!pcsRef.current.has(peer.id)) {
        initiateOffer(peer.id);
      }
    }
  }, [participants, selfId, localStream, socket, closePc, initiateOffer]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      closeAll();
    };
  }, [closeAll]);

  return {
    remoteStreams,
    connectionStates,
  };
}