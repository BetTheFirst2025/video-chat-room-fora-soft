import { useNavigate } from 'react-router-dom';
import NameForm from '../components/NameForm.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { generateRoomId } from '../lib/roomId.js';
import { isWebRTCSupported } from '../lib/webrtcSupport.js';

export default function StartPage() {
  const navigate = useNavigate();
  const supported = isWebRTCSupported();

  const handleCreate = (name) => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`, { state: { name } });
  };

  if (!supported) {
    return (
      <div className="page">
        <h1>Видеочат-комната</h1>
        <ErrorBanner kind="WEBRTC_UNSUPPORTED" />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Видеочат-комната</h1>
      <p className="page__subtitle">
        Введите имя, чтобы создать комнату и пригласить других.
      </p>
      <NameForm onSubmit={handleCreate} submitLabel="Создать комнату" />
    </div>
  );
}