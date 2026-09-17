import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import VideoGrid from './VideoGrid.jsx';

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

function tile(id, name, extra = {}) {
  return {
    id,
    name,
    stream: null,
    audioEnabled: true,
    videoEnabled: true,
    ...extra,
  };
}

describe('VideoGrid', () => {
  it('1 плитка — modifier --1', () => {
    const { container } = render(<VideoGrid tiles={[tile('a', 'Алекс')]} />);
    expect(container.querySelector('.video-grid--1')).toBeTruthy();
  });

  it('2 плитки — modifier --2', () => {
    const { container } = render(
      <VideoGrid tiles={[tile('a', 'Алекс'), tile('b', 'Мария')]} />
    );
    expect(container.querySelector('.video-grid--2')).toBeTruthy();
  });

  it('3 плитки — modifier --4', () => {
    const { container } = render(
      <VideoGrid
        tiles={[tile('a', 'A'), tile('b', 'B'), tile('c', 'C')]}
      />
    );
    expect(container.querySelector('.video-grid--4')).toBeTruthy();
  });

  it('4 плитки — modifier --4', () => {
    const { container } = render(
      <VideoGrid
        tiles={[tile('a', 'A'), tile('b', 'B'), tile('c', 'C'), tile('d', 'D')]}
      />
    );
    expect(container.querySelector('.video-grid--4')).toBeTruthy();
  });

  it('рендерит столько плиток, сколько передано', () => {
    const { container } = render(
      <VideoGrid tiles={[tile('a', 'A'), tile('b', 'B')]} />
    );
    expect(container.querySelectorAll('.video-tile')).toHaveLength(2);
  });
});