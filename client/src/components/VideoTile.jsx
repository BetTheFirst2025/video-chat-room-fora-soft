import { memo, useEffect, useRef } from 'react';

/**
 * Одна плитка видео.
 *
 * @param {{
 *   name: string,
 *   stream: MediaStream | null,
 *   audioEnabled: boolean,
 *   videoEnabled: boolean,
 *   isSelf?: boolean,
 *   connectionState?: RTCPeerConnectionState,
 * }} props
 */
function VideoTile({
  name,
  stream,
  audioEnabled,
  videoEnabled,
  isSelf = false,
  connectionState = 'connected',
}) {
  const videoRef = useRef(null);

  // Привязываем MediaStream к <video> через ref (без пересоздания элемента)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream && el.srcObject !== stream) {
      el.srcObject = stream;
      // autoplay может быть заблокирован — играем по клику, если упадёт
      el.play().catch((err) => {
        console.warn('[VideoTile] play() failed:', err.name);
      });
    } else if (!stream) {
      el.srcObject = null;
    }
  }, [stream]);

  const showVideo = videoEnabled && stream;

  return (
    <div className={`video-tile${isSelf ? ' video-tile--self' : ''}`}>
      <video
        ref={videoRef}
        className={`video-tile__video${showVideo ? '' : ' video-tile__video--hidden'}`}
        autoPlay
        playsInline
        muted={isSelf}
      />

      {!showVideo && (
        <div className="video-tile__placeholder">
          <div className="video-tile__avatar" aria-hidden="true">
            <svg viewBox="0 0 100 100" width="64" height="64">
              <circle cx="50" cy="35" r="20" fill="#3a3a3a" />
              <path d="M 20 90 Q 50 55 80 90 Z" fill="#3a3a3a" />
            </svg>
          </div>
        </div>
      )}

      <div className="video-tile__overlay">
        <span className="video-tile__name">
          {name}
          {isSelf && ' (вы)'}
        </span>

        {!audioEnabled && (
          <span className="video-tile__icon video-tile__icon--muted" title="Микрофон выключен">
            🔇
          </span>
        )}

        {!videoEnabled && (
          <span className="video-tile__icon video-tile__icon--cam-off" title="Камера выключена">
            🚫
          </span>
        )}

        {!isSelf && connectionState !== 'connected' && connectionState !== 'completed' && (
          <span
            className="video-tile__icon video-tile__icon--status"
            title={`Состояние: ${connectionState}`}
          >
            ⏳
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(VideoTile);