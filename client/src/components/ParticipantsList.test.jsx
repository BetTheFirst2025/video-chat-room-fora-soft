import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipantsList from './ParticipantsList.jsx';

function p(id, name, extra = {}) {
  return { id, name, ...extra };
}

describe('ParticipantsList', () => {
  it('показывает количество', () => {
    render(
      <ParticipantsList
        participants={[p('a', 'Алекс'), p('b', 'Мария')]}
        selfId="a"
      />
    );
    expect(screen.getByText(/Участники \(2\)/)).toBeInTheDocument();
  });

  it('рендерит всех участников', () => {
    render(
      <ParticipantsList
        participants={[p('a', 'Алекс'), p('b', 'Мария')]}
        selfId="a"
      />
    );
    expect(screen.getByText(/Алекс/)).toBeInTheDocument();
    expect(screen.getByText(/Мария/)).toBeInTheDocument();
  });

  it('помечает себя "(вы)"', () => {
    render(
      <ParticipantsList participants={[p('a', 'Алекс')]} selfId="a" />
    );
    expect(screen.getByText(/\(вы\)/)).toBeInTheDocument();
  });

  it('показывает 🔇 при audioEnabled=false', () => {
    render(
      <ParticipantsList
        participants={[p('a', 'Алекс', { audioEnabled: false })]}
        selfId="b"
      />
    );
    expect(screen.getByTitle(/Микрофон выключен/)).toBeInTheDocument();
  });

  it('показывает 🚫 при videoEnabled=false', () => {
    render(
      <ParticipantsList
        participants={[p('a', 'Алекс', { videoEnabled: false })]}
        selfId="b"
      />
    );
    expect(screen.getByTitle(/Камера выключена/)).toBeInTheDocument();
  });

  it('не показывает иконки, если всё включено', () => {
    render(
      <ParticipantsList
        participants={[p('a', 'Алекс', { audioEnabled: true, videoEnabled: true })]}
        selfId="b"
      />
    );
    expect(screen.queryByTitle(/Микрофон выключен/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Камера выключена/)).not.toBeInTheDocument();
  });
});