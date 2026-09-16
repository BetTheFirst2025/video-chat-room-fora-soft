import { useNavigate } from 'react-router-dom';
import NameForm from '../components/NameForm.jsx';
import { generateRoomId } from '../lib/roomId.js';

export default function StartPage() {
  const navigate = useNavigate();

  const handleCreate = (name) => {
    const roomId = generateRoomId();
    // Имя передаём через state — не через localStorage (PRD §5: без клиентского хранилища)
    navigate(`/room/${roomId}`, { state: { name } });
  };

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