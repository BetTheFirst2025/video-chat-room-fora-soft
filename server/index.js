import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { RoomRegistry } from './rooms/RoomRegistry.js';
import { registerHandlers } from './signaling/handlers.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === 'development' ? '*' : false,
    methods: ['GET', 'POST'],
  },
});

// === Security headers (task 44) ===
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
  next();
});

// === CSP только в production ===
if (config.NODE_ENV === 'production') {
  app.use((_req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "connect-src 'self' wss: ws:",
        "media-src 'self' blob:",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
      ].join('; ')
    );
    next();
  });
}

/** Единственный реестр комнат на процесс. */
const registry = new RoomRegistry();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    rooms: registry.size(),
    env: config.NODE_ENV,
  });
});

io.on('connection', (socket) => {
  registerHandlers(io, socket, registry);
});

httpServer.listen(config.PORT, () => {
  console.log(`[server] running on http://localhost:${config.PORT}`);
  console.log(`[server] NODE_ENV=${config.NODE_ENV}`);
});

export { app, httpServer, io, registry };