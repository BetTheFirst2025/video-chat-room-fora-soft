import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoTile from './VideoTile.jsx';

// jsdom не реализует HTMLMediaElement.play() — заглушаем
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

function mockStream() {
  return { id: 'stream-1' };
}

describe('VideoTile', () => {
  it('рендерит имя и self-маркер', () => {
    render(
      <VideoTile name="Алекс" stream={null} audioEnabled videoEnabled isSelf />
    );
    expect(screen.getByText(/Алекс/)).toBeInTheDocument();
    expect(screen.getByText(/\(вы\)/)).toBeInTheDocument();
  });

  it('показывает видео, если videoEnabled и stream есть', () => {
    const { container } = render(
      <VideoTile name="Мария" stream={mockStream()} audioEnabled videoEnabled />
    );
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video.classList.contains('video-tile__video--hidden')).toBe(false);
  });

  it('показывает заглушку, если videoEnabled=false', () => {
    const { container } = render(
      <VideoTile name="Мария" stream={mockStream()} audioEnabled videoEnabled={false} />
    );
    const video = container.querySelector('video');
    expect(video.classList.contains('video-tile__video--hidden')).toBe(true);
    expect(container.querySelector('.video-tile__placeholder')).toBeTruthy();
  });

  it('показывает заглушку, если stream=null', () => {
    const { container } = render(
      <VideoTile name="Мария" stream={null} audioEnabled videoEnabled />
    );
    expect(container.querySelector('.video-tile__placeholder')).toBeTruthy();
  });

  it('показывает иконку mute при audioEnabled=false', () => {
    render(
      <VideoTile name="Мария" stream={null} audioEnabled={false} videoEnabled />
    );
    expect(screen.getByTitle(/Микрофон выключен/)).toBeInTheDocument();
  });

  it('показывает иконку cam-off при videoEnabled=false', () => {
    render(
      <VideoTile name="Мария" stream={null} audioEnabled videoEnabled={false} />
    );
    expect(screen.getByTitle(/Камера выключена/)).toBeInTheDocument();
  });

  it('muted=true для isSelf (защита от эха)', () => {
    const { container } = render(
      <VideoTile name="Алекс" stream={mockStream()} audioEnabled videoEnabled isSelf />
    );
    const video = container.querySelector('video');
    expect(video.muted).toBe(true);
  });

  it('muted=false для не-self', () => {
    const { container } = render(
      <VideoTile name="Мария" stream={mockStream()} audioEnabled videoEnabled />
    );
    const video = container.querySelector('video');
    expect(video.muted).toBe(false);
  });

  it('показывает ⏳ при connectionState != connected (не self)', () => {
    render(
      <VideoTile
        name="Мария"
        stream={null}
        audioEnabled
        videoEnabled
        connectionState="connecting"
      />
    );
    expect(screen.getByTitle(/Состояние: connecting/)).toBeInTheDocument();
  });

  it('не показывает ⏳, если connectionState=connected', () => {
    render(
      <VideoTile
        name="Мария"
        stream={null}
        audioEnabled
        videoEnabled
        connectionState="connected"
      />
    );
    expect(screen.queryByTitle(/Состояние:/)).not.toBeInTheDocument();
  });
});