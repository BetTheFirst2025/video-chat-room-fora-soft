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
    expect(screen.getByText(/Стартовый экран/i)).toBeInTheDocument();
  });

  it('рендерит RoomPage на /room/:roomId', () => {
    render(
      <MemoryRouter initialEntries={['/room/test-room-1']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/test-room-1/)).toBeInTheDocument();
  });

  it('редиректит на / при неизвестном маршруте', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App />
      </MemoryRouter>
    );
    // После редиректа должны увидеть StartPage
    expect(screen.getByText(/Стартовый экран/i)).toBeInTheDocument();
  });
});