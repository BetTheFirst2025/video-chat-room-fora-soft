import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoomPage from './RoomPage.jsx';

// Мокаем useSocket
vi.mock('../hooks/useSocket.js', () => ({
  useSocket: vi.fn(() => ({
    connected: true,
    error: null,
    selfId: 'sock-1',
    participants: [{ id: 'sock-1', name: 'Алекс' }],
    messages: [],
    sendMessage: vi.fn(),
    sendSignal: vi.fn(),
    sendMediaState: vi.fn(),
    leaveRoom: vi.fn(),
  })),
}));

import { useSocket } from '../hooks/useSocket.js';

function renderWithRoute(initialEntry, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialEntry, state }]}>
      <Routes>
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoomPage', () => {
  it('показывает форму ввода имени, если state пустой', () => {
    renderWithRoute('/room/test-room-1', null);

    expect(screen.getByText(/test-room-1/)).toBeInTheDocument();
    expect(screen.getByText(/Представьтесь/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
  });

  it('рендерит комнату, если name передан в state', () => {
    renderWithRoute('/room/test-room-1', { name: 'Алекс' });

    expect(screen.getByText(/test-room-1/)).toBeInTheDocument();
    expect(screen.getByText(/Подключено/)).toBeInTheDocument();
    expect(screen.getByText(/Алекс/)).toBeInTheDocument();
  });

  it('вызывает useSocket с roomId и name', () => {
    renderWithRoute('/room/my-room-42', { name: 'Мария' });

    expect(useSocket).toHaveBeenCalledWith('my-room-42', 'Мария');
  });

  it('после ввода имени показывает комнату', () => {
    renderWithRoute('/room/test-room-1', null);

    fireEvent.change(screen.getByLabelText(/Ваше имя/i), {
      target: { value: 'Алекс' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

    expect(useSocket).toHaveBeenCalledWith('test-room-1', 'Алекс');
  });

  it('показывает ошибку, если useSocket вернул error', () => {
    useSocket.mockReturnValueOnce({
      connected: false,
      error: { code: 'ROOM_FULL' },
      selfId: null,
      participants: [],
      messages: [],
    });

    renderWithRoute('/room/test-room-1', { name: 'Алекс' });
    expect(screen.getByText(/ROOM_FULL/)).toBeInTheDocument();
  });
});