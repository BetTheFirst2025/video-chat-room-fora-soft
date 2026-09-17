import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Controls from './Controls.jsx';

function defaultProps(overrides = {}) {
  return {
    audioEnabled: true,
    videoEnabled: true,
    copied: false,
    onToggleAudio: vi.fn(),
    onToggleVideo: vi.fn(),
    onCopyLink: vi.fn(),
    onLeave: vi.fn(),
    ...overrides,
  };
}

describe('Controls', () => {
  it('рендерит 4 кнопки', () => {
    render(<Controls {...defaultProps()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('mic: on → 🎤 и «Микрофон»', () => {
    render(<Controls {...defaultProps({ audioEnabled: true })} />);
    expect(screen.getByTitle(/Выключить микрофон/)).toBeInTheDocument();
  });

  it('mic: off → 🔇 и «Выкл»', () => {
    render(<Controls {...defaultProps({ audioEnabled: false })} />);
    expect(screen.getByTitle(/Включить микрофон/)).toBeInTheDocument();
  });

  it('cam: on → 📹 и «Камера»', () => {
    render(<Controls {...defaultProps({ videoEnabled: true })} />);
    expect(screen.getByTitle(/Выключить камеру/)).toBeInTheDocument();
  });

  it('cam: off → 🚫 и «Выкл»', () => {
    render(<Controls {...defaultProps({ videoEnabled: false })} />);
    expect(screen.getByTitle(/Включить камеру/)).toBeInTheDocument();
  });

  it('copy: not copied → 🔗 и «Ссылка»', () => {
    render(<Controls {...defaultProps({ copied: false })} />);
    expect(screen.getByTitle(/Скопировать ссылку-приглашение/)).toBeInTheDocument();
  });

  it('copy: copied → ✓ и «Скопировано»', () => {
    render(<Controls {...defaultProps({ copied: true })} />);
    expect(screen.getByText('Скопировано')).toBeInTheDocument();
  });

  it('клик по mic → onToggleAudio', () => {
    const onToggleAudio = vi.fn();
    render(<Controls {...defaultProps({ onToggleAudio })} />);
    fireEvent.click(screen.getByTitle(/Выключить микрофон/));
    expect(onToggleAudio).toHaveBeenCalledOnce();
  });

  it('клик по cam → onToggleVideo', () => {
    const onToggleVideo = vi.fn();
    render(<Controls {...defaultProps({ onToggleVideo })} />);
    fireEvent.click(screen.getByTitle(/Выключить камеру/));
    expect(onToggleVideo).toHaveBeenCalledOnce();
  });

  it('клик по copy → onCopyLink', () => {
    const onCopyLink = vi.fn();
    render(<Controls {...defaultProps({ onCopyLink })} />);
    fireEvent.click(screen.getByTitle(/Скопировать ссылку-приглашение/));
    expect(onCopyLink).toHaveBeenCalledOnce();
  });

  it('клик по leave → onLeave', () => {
    const onLeave = vi.fn();
    render(<Controls {...defaultProps({ onLeave })} />);
    fireEvent.click(screen.getByTitle(/Выйти из комнаты/));
    expect(onLeave).toHaveBeenCalledOnce();
  });
});