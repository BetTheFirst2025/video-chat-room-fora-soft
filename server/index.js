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