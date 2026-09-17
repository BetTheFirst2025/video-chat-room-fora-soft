import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { config } from './config.js';
import { RoomRegistry } from './rooms/RoomRegistry.js';
import { registerHandlers } from './signaling/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
  next();
});

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

const clientDist = join(__dirname, '..', 'client', 'dist');

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA-fallback: GET кроме /health и /socket.io → index.html
  app.get(/^\/(?!health|socket\.io).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });

  console.log(`[server] serving client from ${clientDist}`);
} else {
  console.log('[server] client/dist not found — run `npm run build` first');
}

// === HTTPS или HTTP (task 54) ===
let httpServer;
if (config.SSL_CERT && config.SSL_KEY) {
  const certPath = join(__dirname, config.SSL_CERT);
  const keyPath = join(__dirname, config.SSL_KEY);

  if (!existsSync(certPath) || !existsSync(keyPath)) {
    console.error(
      `[server] SSL cert or key not found: ${certPath}, ${keyPath}`
    );
    console.error('[server] Falling back to HTTP');
    httpServer = createHttpServer(app);
  } else {
    const options = {
      cert: readFileSync(certPath),
      key: readFileSync(keyPath),
    };
    httpServer = createHttpsServer(options, app);
    console.log('[server] HTTPS enabled');
  }
} else {
  httpServer = createHttpServer(app);
}

// === Socket.io ===
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === 'development' ? '*' : false,
    methods: ['GET', 'POST'],
  },
});

// === Registry ===
const registry = new RoomRegistry();

// === Health-check ===
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    rooms: registry.size(),
    env: config.NODE_ENV,
  });
});

// === Socket.io handlers ===
io.on('connection', (socket) => {
  registerHandlers(io, socket, registry);
});

// === Запуск ===
httpServer.listen(config.PORT, () => {
  const protocol = config.SSL_CERT && config.SSL_KEY ? 'https' : 'http';
  console.log(`[server] running on ${protocol}://localhost:${config.PORT}`);
  console.log(`[server] NODE_ENV=${config.NODE_ENV}`);
});

export { app, httpServer, io, registry };