import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPanel from './ChatPanel.jsx';

function msg(overrides = {}) {
  return {
    id: 'm1',
    kind: 'user',
    authorId: 'sock-1',
    authorName: 'Алекс',
    text: 'Привет!',
    ts: new Date('2025-01-01T12:34:00').getTime(),
    ...overrides,
  };
}

describe('ChatPanel', () => {
  it('показывает сообщение с автором и временем', () => {
    render(<ChatPanel messages={[msg()]} selfId="sock-2" onSend={vi.fn()} />);
    expect(screen.getByText('Алекс')).toBeInTheDocument();
    expect(screen.getByText('Привет!')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('рендерит system-сообщение без автора', () => {
    render(
      <ChatPanel
        messages={[msg({ kind: 'system', authorName: undefined, authorId: undefined, text: 'Алекс присоединился' })]}
        selfId="sock-1"
        onSend={vi.fn()}
      />
    );
    expect(screen.getByText('Алекс присоединился')).toBeInTheDocument();
    expect(screen.queryByText('Алекс')).not.toBeInTheDocument();
  });

  it('показывает пустое состояние', () => {
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={vi.fn()} />);
    expect(screen.getByText(/Сообщений пока нет/)).toBeInTheDocument();
  });

  it('кнопка disabled при пустом поле', () => {
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('отправляет сообщение при submit', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText(/Введите сообщение/), {
      target: { value: 'Привет' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Привет');
  });

  it('очищает поле после отправки', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Введите сообщение/);
    fireEvent.change(input, { target: { value: 'Привет' } });
    fireEvent.click(screen.getByRole('button'));

    expect(input.value).toBe('');
  });

  it('отправляет по Enter (без Shift)', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Введите сообщение/);
    fireEvent.change(input, { target: { value: 'Привет' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledWith('Привет');
  });

  it('НЕ отправляет по Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Введите сообщение/);
    fireEvent.change(input, { target: { value: 'Привет' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('НЕ отправляет пустое сообщение', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText(/Введите сообщение/), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('обрезает пробелы при отправке', () => {
    const onSend = vi.fn();
    render(<ChatPanel messages={[]} selfId="sock-1" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText(/Введите сообщение/), {
      target: { value: '  Привет  ' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Привет');
  });

  it('сообщение самого себя имеет класс --self', () => {
    const { container } = render(
      <ChatPanel messages={[msg({ authorId: 'sock-me' })]} selfId="sock-me" onSend={vi.fn()} />
    );
    expect(container.querySelector('.chat__msg--self')).toBeTruthy();
  });
});