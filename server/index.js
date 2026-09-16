import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';

const app = express();
const httpServer = createServer(app);
// eslint-disable-next-line no-unused-vars
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === 'development' ? '*' : false,
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

httpServer.listen(config.PORT, () => {
  console.log(`[server] running on http://localhost:${config.PORT}`);
  console.log(`[server] NODE_ENV=${config.NODE_ENV}`);
});