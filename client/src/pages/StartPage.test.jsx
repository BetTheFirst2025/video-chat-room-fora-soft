import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StartPage from './StartPage.jsx';
import { isWebRTCSupported } from '../lib/webrtcSupport.js';

// === Мок useNavigate ===
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// === Мок isWebRTCSupported ===
vi.mock('../lib/webrtcSupport.js', () => ({
  isWebRTCSupported: vi.fn(() => true),
}));

beforeEach(() => {
  mockNavigate.mockClear();
  isWebRTCSupported.mockReturnValue(true); // по умолчанию — поддерживается
});

describe('StartPage', () => {
  it('рендерит заголовок и форму', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <StartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Видеочат-комната/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
  });

  it('при submit редиректит на /room/:id с name в state', () => {
    mockNavigate.mockClear();

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <StartPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Ваше имя/i), {
      target: { value: 'Алекс' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать комнату/i }));

    expect(mockNavigate).toHaveBeenCalledOnce();
    const [path, options] = mockNavigate.mock.calls[0];
    expect(path).toMatch(/^\/room\/[A-Za-z0-9_-]{10}$/);
    expect(options.state).toEqual({ name: 'Алекс' });
  });

  it('показывает WEBRTC_UNSUPPORTED, если браузер не поддерживает', () => {
    isWebRTCSupported.mockReturnValueOnce(false);

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <StartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/WebRTC не поддерживается/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Ваше имя/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Создать комнату/i })
    ).not.toBeInTheDocument();
  });

  it('показывает форму, если браузер поддерживает WebRTC', () => {
    isWebRTCSupported.mockReturnValueOnce(true);

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <StartPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
    expect(screen.queryByText(/WebRTC не поддерживается/)).not.toBeInTheDocument();
  });
});