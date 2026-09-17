/**
 * Сообщение об ошибке с опциональной кнопкой действия.
 *
 * @param {{
 *   kind: 'SERVER_DOWN' | 'WEBRTC_UNSUPPORTED' | 'MEDIA_DENIED' | 'NO_VIDEO' | 'NO_AUDIO' | 'ROOM_FULL' | 'INVALID_NAME' | 'INVALID_ROOM' | 'UNKNOWN',
 *   message?: string,
 *   onRetry?: () => void,
 * }} props
 */
const TITLES = {
  SERVER_DOWN: 'Сервер недоступен',
  WEBRTC_UNSUPPORTED: 'WebRTC не поддерживается',
  MEDIA_DENIED: 'Нет доступа к камере/микрофону',
  NO_VIDEO: 'Камера недоступна',
  NO_AUDIO: 'Микрофон недоступен',
  ROOM_FULL: 'Комната заполнена',
  INVALID_NAME: 'Некорректное имя',
  INVALID_ROOM: 'Некорректная ссылка',
  UNKNOWN: 'Произошла ошибка',
};

const DESCRIPTIONS = {
  SERVER_DOWN:
    'Не удалось подключиться к сигнальному серверу. Проверьте интернет и попробуйте ещё раз.',
  WEBRTC_UNSUPPORTED:
    'Ваш браузер не поддерживает WebRTC. Используйте современный Chrome, Firefox или Edge.',
  MEDIA_DENIED:
    'Вы не дали доступ к камере/микрофону. Вы можете остаться в комнате, но вас не будет видно и слышно.',
  NO_VIDEO: 'Камера недоступна или занята другим приложением. Вы в комнате без видео.',
  NO_AUDIO: 'Микрофон недоступен или занят другим приложением. Вы в комнате без звука.',
  ROOM_FULL: 'В комнате уже 4 участника. Попробуйте войти позже.',
  INVALID_NAME: 'Пожалуйста, введите корректное имя (1–30 символов).',
  INVALID_ROOM: 'Ссылка на комнату повреждена. Вернитесь на главную и создайте новую.',
  UNKNOWN: 'Что-то пошло не так. Попробуйте обновить страницу.',
};

export default function ErrorBanner({ kind, message, onRetry }) {
  const title = TITLES[kind] ?? TITLES.UNKNOWN;
  const description = DESCRIPTIONS[kind] ?? DESCRIPTIONS.UNKNOWN;

  const showRetry =
    (kind === 'SERVER_DOWN' || kind === 'ROOM_FULL') && typeof onRetry === 'function';

  return (
    <div className={`error-banner error-banner--${kind.toLowerCase()}`} role="alert">
      <div className="error-banner__content">
        <div className="error-banner__title">{title}</div>
        <div className="error-banner__description">{description}</div>
        {message && <div className="error-banner__details">{message}</div>}
      </div>
      {showRetry && (
        <button
          type="button"
          className="error-banner__retry"
          onClick={onRetry}
        >
          Повторить
        </button>
      )}
    </div>
  );
}