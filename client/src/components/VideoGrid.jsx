import VideoTile from './VideoTile.jsx';

/**
 * Адаптивная сетка видео-плиток (1 / 2 / 3–4).
 *
 * @param {{
 *   tiles: Array<{
 *     id: string,
 *     name: string,
 *     stream: MediaStream | null,
 *     audioEnabled: boolean,
 *     videoEnabled: boolean,
 *     isSelf?: boolean,
 *     connectionState?: RTCPeerConnectionState,
 *   }>,
 * }} props
 */
export default function VideoGrid({ tiles, onAutoplayBlocked }) {
  const count = tiles.length;

  let modifier = 'video-grid--1';
  if (count === 2) modifier = 'video-grid--2';
  else if (count >= 3) modifier = 'video-grid--4';

  return (
    <div className={`video-grid ${modifier}`}>
      {tiles.map((tile) => (
        <VideoTile
          key={tile.id}
          name={tile.name}
          stream={tile.stream}
          audioEnabled={tile.audioEnabled}
          videoEnabled={tile.videoEnabled}
          isSelf={tile.isSelf}
          connectionState={tile.connectionState}
          onAutoplayBlocked={onAutoplayBlocked}
        />
      ))}
    </div>
  );
}