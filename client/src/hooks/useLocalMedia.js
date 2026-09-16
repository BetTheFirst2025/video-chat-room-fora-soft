import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Хук для работы с локальными медиа-устройствами (камера, микрофон).
 *
 * При монтировании запрашивает getUserMedia. Если пользователь запретил
 * доступ или устройств нет — не вылетает, а выставляет флаги enabled=false.
 *
 * @returns {{
 *   stream: MediaStream | null,
 *   audioEnabled: boolean,
 *   videoEnabled: boolean,
 *   error: { code: string, message?: string } | null,
 *   toggleAudio: () => void,
 *   toggleVideo: () => Promise<void>,
 * }}
 */
export function useLocalMedia() {
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState(null);

  // === Запрос медиа при монтировании ===
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setStream(s);
        setAudioEnabled(true);
        setVideoEnabled(true);
      } catch (err) {
        if (cancelled) return;
        console.warn('[useLocalMedia] getUserMedia failed:', err.name, err.message);

        // Fallback: пробуем audio-only, потом video-only, потом ничего
        await tryFallback(cancelled);
      }
    })();

    async function tryFallback(cancelled) {
      // Audio-only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = audioStream;
        setStream(audioStream);
        setAudioEnabled(true);
        setVideoEnabled(false);
        setError({ code: 'NO_VIDEO' });
        return;
      } catch {
        // ignore
      }

      // Video-only
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
        if (cancelled) {
          videoStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = videoStream;
        setStream(videoStream);
        setAudioEnabled(false);
        setVideoEnabled(true);
        setError({ code: 'NO_AUDIO' });
        return;
      } catch {
        // ignore
      }

      // Ничего
      setStream(null);
      setAudioEnabled(false);
      setVideoEnabled(false);
      setError({ code: 'MEDIA_DENIED' });
    }

    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // === Toggle audio (мьют через enabled, без остановки трека) ===
  const toggleAudio = useCallback(() => {
    const s = streamRef.current;
    if (!s) return;
    const track = s.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  }, []);

  // === Toggle video (с освобождением трека) ===
  const toggleVideo = useCallback(async () => {
    const s = streamRef.current;
    if (!s) return;

    const existingTrack = s.getVideoTracks()[0];

    if (existingTrack && existingTrack.enabled) {
      // Выключаем: останавливаем трек (камера физически освобождается)
      existingTrack.stop();
      s.removeTrack(existingTrack);
      setVideoEnabled(false);
      return;
    }

    // Включаем: получаем новый трек
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newTrack = newStream.getVideoTracks()[0];
      if (newTrack) {
        s.addTrack(newTrack);
        setVideoEnabled(true);
      }
    } catch (err) {
      console.warn('[useLocalMedia] re-enable camera failed:', err.name);
      setVideoEnabled(false);
    }
  }, []);

  return {
    stream,
    audioEnabled,
    videoEnabled,
    error,
    toggleAudio,
    toggleVideo,
  };
}