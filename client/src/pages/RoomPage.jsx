import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { roomId } = useParams();
  return (
    <div className="page">
      <h1>Комната: {roomId}</h1>
      <p>Экран комнаты (будет реализован в задаче 21).</p>
    </div>
  );
}