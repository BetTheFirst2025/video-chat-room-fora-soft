import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StartPage from './StartPage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StartPage', () => {
  it('рендерит заголовок и форму', () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Видеочат-комната/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
  });

  it('при submit редиректит на /room/:id с name в state', () => {
    mockNavigate.mockClear();

    render(
      <MemoryRouter>
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
});