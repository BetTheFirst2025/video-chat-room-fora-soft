/**
 * Список участников комнаты.
 *
 * @param {{
 *   participants: Array<{
 *     id: string,
 *     name: string,
 *     audioEnabled?: boolean,
 *     videoEnabled?: boolean,
 *   }>,
 *   selfId: string | null,
 * }} props
 */
export default function ParticipantsList({ participants, selfId }) {
  return (
    <div className="participants">
      <h2 className="participants__title">
        Участники ({participants.length})
      </h2>
      <ul className="participants__list">
        {participants.map((p) => (
          <li
            key={p.id}
            className={`participants__item${
              p.id === selfId ? ' participants__item--self' : ''
            }`}
          >
            <span className="participants__name">
              {p.name}
              {p.id === selfId && ' (вы)'}
            </span>
            <span className="participants__icons">
              {p.audioEnabled === false && (
                <span className="participants__icon" title="Микрофон выключен">
                  🔇
                </span>
              )}
              {p.videoEnabled === false && (
                <span className="participants__icon" title="Камера выключена">
                  🚫
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}