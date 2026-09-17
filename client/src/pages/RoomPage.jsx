import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NameForm from '../components/NameForm.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { useLocalMedia } from '../hooks/useLocalMedia.js';
import { useMesh } from '../hooks/useMesh.js';
import VideoGrid from '../components/VideoGrid.jsx';
import Controls from '../components/Controls.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import ParticipantsList from '../components/ParticipantsList.jsx';

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
    sendMessage,
    sendMediaState,
    sendSignal,
    leaveRoom,
  } = useSocket(roomId, name);

  const {
    stream: localStream,
    audioEnabled,
    videoEnabled,
    error: mediaError,
    toggleAudio,
    toggleVideo,
  } = useLocalMedia();

  const { remoteStreams, connectionStates } = useMesh({
    socket,
    localStream,
    participants,
    selfId,
    sendSignal,
  });

  const tiles = participants.map((p) => ({
    id: p.id,
    name: p.name,
    stream: p.id === selfId ? localStream : (remoteStreams.get(p.id) ?? null),
    audioEnabled: p.id === selfId ? audioEnabled : p.audioEnabled !== false,
    videoEnabled: p.id === selfId ? videoEnabled : p.videoEnabled !== false,
    isSelf: p.id === selfId,
    connectionState: p.id === selfId ? 'connected' : connectionStates.get(p.id),
  }));

  const { copy, copied } = useCopyToClipboard();
  const inviteUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Синхронизируем медиа-состояние с сервером
  useEffect(() => {
    if (!connected) return;
    sendMediaState({ audioEnabled, videoEnabled });
  }, [connected, audioEnabled, videoEnabled, sendMediaState]);

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
        <div className="room__status">
          {connected ? '🟢 Подключено' : '🔴 Подключение…'}
        </div>
      </header>

      <main className="room__main">
        <section className="room__video">
          {mediaError && (
            <p className="media-error media-error--floating">
              ⚠️ {mediaError.code}
            </p>
          )}
          <VideoGrid tiles={tiles} />
          <Controls
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            copied={copied}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onCopyLink={() => copy(inviteUrl)}
            onLeave={leaveRoom}
          />
        </section>

        <aside className="room__sidebar">
          <ParticipantsList participants={participants} selfId={selfId} />

          <section className="room__chat">
            <h2>Чат</h2>
            <ChatPanel messages={messages} selfId={selfId} onSend={sendMessage} />
          </section>
        </aside>
      </main>
    </div>
  );
}