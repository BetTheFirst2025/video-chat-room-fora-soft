import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoomPage from './RoomPage.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js';
import { useLocalMedia } from '../hooks/useLocalMedia.js';

// === Моки хуков ===
vi.mock('../hooks/useSocket.js', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../hooks/useCopyToClipboard.js', () => ({
  useCopyToClipboard: vi.fn(),
}));

vi.mock('../hooks/useLocalMedia.js', () => ({
  useLocalMedia: vi.fn(),
}));

vi.mock('../hooks/useMesh.js', () => ({
  useMesh: vi.fn(() => ({
    remoteStreams: new Map(),
    connectionStates: new Map(),
  })),
}));

// === Дефолтные возвраты ===
function defaultSocketReturn(overrides = {}) {
  return {
    socket: null,
    connected: true,
    error: null,
    selfId: 'sock-1',
    participants: [{ id: 'sock-1', name: 'Алекс' }],
    messages: [],
    sendMessage: vi.fn(),
    sendSignal: vi.fn(),
    sendMediaState: vi.fn(),
    leaveRoom: vi.fn(),
    ...overrides,
  };
}

function defaultMediaReturn(overrides = {}) {
  return {
    stream: null,
    audioEnabled: true,
    videoEnabled: true,
    error: null,
    toggleAudio: vi.fn(),
    toggleVideo: vi.fn(),
    ...overrides,
  };
}

function defaultCopyReturn(overrides = {}) {
  return {
    copy: vi.fn(),
    copied: false,
    error: null,
    ...overrides,
  };
}

beforeEach(() => {
  useSocket.mockReset();
  useCopyToClipboard.mockReset();
  useLocalMedia.mockReset();

  useSocket.mockImplementation(() => defaultSocketReturn());
  useCopyToClipboard.mockImplementation(() => defaultCopyReturn());
  useLocalMedia.mockImplementation(() => defaultMediaReturn());
});

function renderWithRoute(initialEntry, state) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: initialEntry, state }]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
    expect(screen.getAllByText(/Алекс/).length).toBeGreaterThan(0);
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
    useSocket.mockImplementation(() =>
      defaultSocketReturn({
        connected: false,
        error: { code: 'ROOM_FULL' },
        selfId: null,
        participants: [],
      })
    );

    renderWithRoute('/room/test-room-1', { name: 'Алекс' });
    expect(screen.getByText(/ROOM_FULL/)).toBeInTheDocument();
  });

  it('рендерит кнопку «Ссылка» из Controls', () => {
    renderWithRoute('/room/test-room-1', { name: 'Алекс' });
    // Текст кнопки в Controls: «Ссылка» (или «Скопировано»)
    expect(
      screen.getByRole('button', { name: /Ссылка/i })
    ).toBeInTheDocument();
  });

  it('вызывает copy при клике на кнопку «Ссылка»', () => {
    const copyMock = vi.fn();
    useCopyToClipboard.mockImplementation(() =>
      defaultCopyReturn({ copy: copyMock })
    );

    renderWithRoute('/room/test-room-1', { name: 'Алекс' });
    fireEvent.click(screen.getByRole('button', { name: /Ссылка/i }));

    expect(copyMock).toHaveBeenCalledOnce();
  });
});