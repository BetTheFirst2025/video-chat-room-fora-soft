import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import NameForm from '../components/NameForm.jsx';

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

  return (
    <div className="page">
      <h1>Комната: {roomId}</h1>
      <p>Привет, {name}. Полная реализация комнаты — задача 21.</p>
    </div>
  );
}