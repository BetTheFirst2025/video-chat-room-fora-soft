import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App routing', () => {
  it('рендерит StartPage на /', () => {
    render(
      <MemoryRouter
          initialEntries={['/']}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </MemoryRouter>
    );
    // Проверяем актуальный текст StartPage (задача 20)
    expect(screen.getByText(/Введите имя/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Создать комнату/i })).toBeInTheDocument();
  });

  it('рендерит RoomPage на /room/:roomId', () => {
    render(
      <MemoryRouter initialEntries={['/room/test-room-1']}
       future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/test-room-1/)).toBeInTheDocument();
  });

  it('редиректит на / при неизвестном маршруте', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}
            future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
        <App />
      </MemoryRouter>
    );
    // После редиректа должны увидеть StartPage (задача 20)
    expect(screen.getByText(/Введите имя/i)).toBeInTheDocument();
  });
});