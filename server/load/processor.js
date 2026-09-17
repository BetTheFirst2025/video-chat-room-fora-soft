const { randomBytes } = require('node:crypto');

/**
 * Artillery processor: генерирует уникальный roomId для каждой
 * виртуальной комнаты.
 */
function generateRoomId(context, events, done) {
  const id = randomBytes(7).toString('base64url').slice(0, 10);
  context.vars.roomId = `load-${id}`;
  return done();
}

module.exports = {
  generateRoomId,
};