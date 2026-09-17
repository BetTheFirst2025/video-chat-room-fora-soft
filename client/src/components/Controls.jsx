/**
 * Панель управления комнатой: mic, cam, copy link, leave.
 *
 * @param {{
 *   audioEnabled: boolean,
 *   videoEnabled: boolean,
 *   copied: boolean,
 *   onToggleAudio: () => void,
 *   onToggleVideo: () => void,
 *   onCopyLink: () => void,
 *   onLeave: () => void,
 * }} props
 */
export default function Controls({
  audioEnabled,
  videoEnabled,
  copied,
  onToggleAudio,
  onToggleVideo,
  onCopyLink,
  onLeave,
}) {
  return (
    <div className="controls">
      <button
        type="button"
        className={`controls__btn ${audioEnabled ? 'controls__btn--on' : 'controls__btn--off'}`}
        onClick={onToggleAudio}
        title={audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
      >
        <span className="controls__icon">{audioEnabled ? '🎤' : '🔇'}</span>
        <span className="controls__label">
          {audioEnabled ? 'Микрофон' : 'Выкл'}
        </span>
      </button>

      <button
        type="button"
        className={`controls__btn ${videoEnabled ? 'controls__btn--on' : 'controls__btn--off'}`}
        onClick={onToggleVideo}
        title={videoEnabled ? 'Выключить камеру' : 'Включить камеру'}
      >
        <span className="controls__icon">{videoEnabled ? '📹' : '🚫'}</span>
        <span className="controls__label">
          {videoEnabled ? 'Камера' : 'Выкл'}
        </span>
      </button>

      <button
        type="button"
        className="controls__btn controls__btn--copy"
        onClick={onCopyLink}
        title="Скопировать ссылку-приглашение"
      >
        <span className="controls__icon">{copied ? '✓' : '🔗'}</span>
        <span className="controls__label">
          {copied ? 'Скопировано' : 'Ссылка'}
        </span>
      </button>

      <button
        type="button"
        className="controls__btn controls__btn--leave"
        onClick={onLeave}
        title="Выйти из комнаты"
      >
        <span className="controls__icon">❌</span>
        <span className="controls__label">Выйти</span>
      </button>
    </div>
  );
}