import { Routes, Route, Navigate } from 'react-router-dom';
import StartPage from './pages/StartPage.jsx';
import RoomPage from './pages/RoomPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}