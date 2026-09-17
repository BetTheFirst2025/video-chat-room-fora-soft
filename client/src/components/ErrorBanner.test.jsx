import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBanner from './ErrorBanner.jsx';

describe('ErrorBanner', () => {
  it('показывает заголовок для SERVER_DOWN', () => {
    render(<ErrorBanner kind="SERVER_DOWN" />);
    expect(screen.getByText(/Сервер недоступен/)).toBeInTheDocument();
  });

  it('показывает заголовок для ROOM_FULL', () => {
    render(<ErrorBanner kind="ROOM_FULL" />);
    expect(screen.getByText(/Комната заполнена/)).toBeInTheDocument();
  });

  it('показывает заголовок для WEBRTC_UNSUPPORTED', () => {
    render(<ErrorBanner kind="WEBRTC_UNSUPPORTED" />);
    expect(screen.getByText(/WebRTC не поддерживается/)).toBeInTheDocument();
  });

  it('показывает заголовок для MEDIA_DENIED', () => {
    render(<ErrorBanner kind="MEDIA_DENIED" />);
    expect(screen.getByText(/Нет доступа/)).toBeInTheDocument();
  });

  it('role=alert', () => {
    render(<ErrorBanner kind="SERVER_DOWN" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('показывает кнопку «Повторить» для SERVER_DOWN с onRetry', () => {
    render(<ErrorBanner kind="SERVER_DOWN" onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Повторить/i })).toBeInTheDocument();
  });

  it('НЕ показывает кнопку для MEDIA_DENIED', () => {
    render(<ErrorBanner kind="MEDIA_DENIED" onRetry={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('НЕ показывает кнопку для SERVER_DOWN без onRetry', () => {
    render(<ErrorBanner kind="SERVER_DOWN" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('вызывает onRetry при клике', () => {
    const onRetry = vi.fn();
    render(<ErrorBanner kind="ROOM_FULL" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /Повторить/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('показывает message, если передан', () => {
    render(<ErrorBanner kind="SERVER_DOWN" message="timeout 5000ms" />);
    expect(screen.getByText(/timeout 5000ms/)).toBeInTheDocument();
  });

  it('fallback на UNKNOWN для незнакомого kind', () => {
    render(<ErrorBanner kind="SOMETHING_ELSE" />);
    expect(screen.getByText(/Произошла ошибка/)).toBeInTheDocument();
  });
});