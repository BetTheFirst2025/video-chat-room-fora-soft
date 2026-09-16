/**
 * Конфигурация для RTCPeerConnection.
 *
 * Использует публичные Google STUN. TURN отсутствует (по PRD).
 * Если пара пиров не сможет установить соединение из-за строгого NAT —
 * это допустимо: звонок с остальными продолжится.
 *
 * @type {RTCConfiguration}
 */
export const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};