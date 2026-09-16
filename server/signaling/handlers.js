/**
 * Регистрирует обработчики Socket.io для одного подключения.
 * Полная реализация — задачи 11–16 (validate, room:join, signal:*, chat:message, ...).
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../rooms/RoomRegistry.js').RoomRegistry} registry
 */
export function registerHandlers(io, socket, registry) {
  console.log(`[socket] connected: ${socket.id}`);

  // Задачи 11–16 добавят:
  //   socket.on('room:join', ...)
  //   socket.on('signal:offer', ...)
  //   socket.on('signal:answer', ...)
  //   socket.on('signal:ice', ...)
  //   socket.on('chat:message', ...)
  //   socket.on('media:state', ...)
  //   socket.on('room:leave', ...)

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });

  // Заглушка — пока ничего не делаем, но ссылаемся на параметры,
  // чтобы не было no-unused-vars.
  void io;
  void registry;
}