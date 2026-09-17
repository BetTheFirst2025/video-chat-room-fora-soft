import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NameForm from '../components/NameForm.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { useLocalMedia } from '../hooks/useLocalMedia.js';
import { useMesh } from '../hooks/useMesh.js';

export default function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const [name, setName] = useState(location.state?.name ?? null);

  if (!name) {
    return (
      <div className="page">
        <h1>Комната: {roomId}</h1>
        <p className="page__subtitle">Представьтесь, чтобы войти.</p>
        <NameForm onSubmit={setName} submitLabel="Войти" />
      </div>
    );
  }

  return <RoomContent roomId={roomId} name={name} />;
}

function RoomContent({ roomId, name }) {
  const {
    socket,
    connected,
    error: socketError,
    selfId,
    participants,
    messages,
    sendMediaState,
    sendSignal,
  } = useSocket(roomId, name);

  const {
    stream: localStream,
    audioEnabled,
    videoEnabled,
    error: mediaError,
    toggleAudio,
    toggleVideo,
  } = useLocalMedia();

  // useMesh: PC-каркас (offer/answer — задача 28)
  const { remoteStreams, connectionStates } = useMesh({
    socket,
    localStream,
    participants,
    selfId,
    sendSignal,
  });

  const { copy, copied } = useCopyToClipboard();
  const inviteUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Синхронизируем медиа-состояние с сервером при изменении.
  useEffect(() => {
    if (!connected) return;
    sendMediaState({ audioEnabled, videoEnabled });
  }, [connected, audioEnabled, videoEnabled, sendMediaState]);

  // Заглушки для задачи 28 — используем, чтобы ESLint не ругался.
  // Полноценное использование будет в задачах 29-35 (VideoGrid).
  useEffect(() => {
    if (remoteStreams.size > 0) {
      console.log('[mesh] remoteStreams:', remoteStreams.size);
    }
  }, [remoteStreams]);

  useEffect(() => {
    if (connectionStates.size > 0) {
      console.log('[mesh] connectionStates:', [...connectionStates.entries()]);
    }
  }, [connectionStates]);

  if (socketError) {
    return (
      <div className="page">
        <h1>Ошибка</h1>
        <p>Код: {socketError.code}</p>
        {socketError.message && <p>{socketError.message}</p>}
      </div>
    );
  }

  return (
    <div className="room">
      <header className="room__header">
        <div className="room__title">
          Комната: <code>{roomId}</code>
        </div>
        <div className="room__header-actions">
          <button
            type="button"
            className="room__copy-btn"
            onClick={() => copy(inviteUrl)}
            title="Скопировать ссылку-приглашение"
          >
            {copied ? '✓ Ссылка скопирована' : '🔗 Скопировать ссылку'}
          </button>
          <div className="room__status">
            {connected ? '🟢 Подключено' : '🔴 Подключение…'}
          </div>
        </div>
      </header>

      <main className="room__main">
        <section className="room__video">
          <div className="room__video-placeholder">
            {mediaError && <p className="media-error">⚠️ {mediaError.code}</p>}
            <p>Видео-сетка появится в задаче 30.</p>
            <p>Участников: {participants.length}</p>
            <p>Локальный поток: {localStream ? '✅ есть' : '❌ нет'}</p>
            <p>Удалённых потоков: {remoteStreams.size}</p>
            <p>
              Микрофон: {audioEnabled ? '🎤 вкл' : '🔇 выкл'} · Камера:{' '}
              {videoEnabled ? '📹 вкл' : '🚫 выкл'}
            </p>
            <div className="room__controls-stub">
              <button type="button" onClick={toggleAudio}>
                {audioEnabled ? '🔇 Выключить микрофон' : '🎤 Включить микрофон'}
              </button>
              <button type="button" onClick={toggleVideo}>
                {videoEnabled ? '🚫 Выключить камеру' : '📹 Включить камеру'}
              </button>
            </div>
          </div>
        </section>

        <aside className="room__sidebar">
          <section className="room__participants">
            <h2>Участники ({participants.length})</h2>
            <ul>
              {participants.map((p) => (
                <li key={p.id}>
                  {p.name}
                  {p.id === selfId && ' (вы)'}
                  {' '}
                  {p.audioEnabled === false && '🔇'}
                  {p.videoEnabled === false && '🚫'}
                </li>
              ))}
            </ul>
          </section>

          <section className="room__chat">
            <h2>Чат</h2>
            <div className="room__chat-placeholder">
              <p>Сообщений: {messages.length}</p>
              {messages.slice(-3).map((m) => (
                <div key={m.id} className={`msg msg--${m.kind}`}>
                  <strong>{m.authorName ?? 'system'}:</strong> {m.text}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}