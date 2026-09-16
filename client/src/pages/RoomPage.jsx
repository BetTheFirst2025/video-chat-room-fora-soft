import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import NameForm from '../components/NameForm.jsx';
import { useSocket } from '../hooks/useSocket.js';

export default function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const [name, setName] = useState(location.state?.name ?? null);

  // Если имя не задано — просим ввести (заход по прямой ссылке)
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

/**
 * Внутренний компонент — монтируется, когда есть name.
 * Нужен, чтобы useSocket не запускался до того, как name известен.
 */
function RoomContent({ roomId, name }) {
  const {
    connected,
    error,
    selfId,
    participants,
    messages,
  } = useSocket(roomId, name);

  if (error) {
    return (
      <div className="page">
        <h1>Ошибка</h1>
        <p>Код: {error.code}</p>
        {error.message && <p>{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="room">
      <header className="room__header">
        <div className="room__title">
          Комната: <code>{roomId}</code>
        </div>
        <div className="room__status">
          {connected ? '🟢 Подключено' : '🔴 Подключение…'}
        </div>
      </header>

      <main className="room__main">
        <section className="room__video">
          {/* Заглушка — VideoGrid появится в задаче 30 */}
          <div className="room__video-placeholder">
            <p>Видео-сетка появится в задаче 30.</p>
            <p>Участников: {participants.length}</p>
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
                </li>
              ))}
            </ul>
          </section>

          <section className="room__chat">
            <h2>Чат</h2>
            {/* Заглушка — ChatPanel появится в задаче 32 */}
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