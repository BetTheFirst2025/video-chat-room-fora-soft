/**
 * Проверяет, поддерживает ли браузер WebRTC (getUserMedia + RTCPeerConnection).
 *
 * @returns {boolean}
 */
export function isWebRTCSupported() {
  if (typeof window === 'undefined') return false;

  const hasPeerConnection =
    typeof window.RTCPeerConnection === 'function';

  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  return hasPeerConnection && hasMediaDevices;
}

/**
 * Возвращает название браузера для диагностики (опционально).
 * @returns {string}
 */
export function getBrowserInfo() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'unknown';
}