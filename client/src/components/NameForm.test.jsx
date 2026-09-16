import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NameForm from './NameForm.jsx';

describe('NameForm', () => {
  it('рендерит поле и кнопку', () => {
    render(<NameForm onSubmit={() => {}} />);
    expect(screen.getByLabelText(/Ваше имя/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('показывает кастомный submitLabel', () => {
    render(<NameForm onSubmit={() => {}} submitLabel="Войти" />);
    expect(screen.getByRole('button')).toHaveTextContent('Войти');
  });

  it('вызывает onSubmit с очищенным именем', () => {
    const onSubmit = vi.fn();
    render(<NameForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText(/Ваше имя/i);
    fireEvent.change(input, { target: { value: '  Алекс  ' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).toHaveBeenCalledWith('Алекс');
  });

  it('показывает ошибку при пустом имени', () => {
    const onSubmit = vi.fn();
    render(<NameForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/Введите имя/i);
  });

  it('показывает ошибку при имени только из пробелов', () => {
    const onSubmit = vi.fn();
    render(<NameForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Ваше имя/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('удаляет спецсимволы', () => {
    const onSubmit = vi.fn();
    render(<NameForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Ваше имя/i), {
      target: { value: 'a@b#c' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).toHaveBeenCalledWith('abc');
  });

  it('очищает ошибку при изменении поля', () => {
    render(<NameForm onSubmit={() => {}} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Ваше имя/i), {
      target: { value: 'Алекс' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});