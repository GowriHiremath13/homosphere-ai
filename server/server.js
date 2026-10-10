import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';

import { config } from './utils/config.js';
import { allowedOrigins, getLanIp } from './utils/network.js';
import { connectDatabase, disconnectDatabase } from './services/dataService.js';
import { loadSettings } from './services/settingsService.js';
import { seedIfEmpty } from './services/demoData.js';
import { setIO } from './services/realtime.js';
import apiRouter from './routes/index.js';
import { initSockets } from './sockets/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const origins = allowedOrigins();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, cb) => cb(null, !origin || origins.includes(origin)) }));
app.use(express.json({ limit: '50kb' }));

app.use('/api', apiRouter);
app.use('/api', notFoundHandler);

// Production: serve the built client from this same process (one port for TV + phone).
const dist = path.resolve(here, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: origins }, pingInterval: 10000, pingTimeout: 8000, maxHttpBufferSize: 1e5 });
setIO(io);
initSockets(io);

async function main() {
  await connectDatabase();
  const settings = await loadSettings();
  if (settings.demoMode) await seedIfEmpty();

  server.listen(config.port, '0.0.0.0', () => {
    const ip = getLanIp();
    console.log(`\nHomeSphere server on http://localhost:${config.port}${ip ? `  (LAN: http://${ip}:${config.port})` : ''}`);
    console.log(`  Mode: ${settings.demoMode ? 'DEMO' : 'LIVE'} | Storage: ${settings.storage} | AI: ${settings.aiConfigured ? config.ai.provider : 'not configured'}`);
    console.log(fs.existsSync(dist) ? '  Serving built client from client/dist' : '  No client build found - run the Vite dev server (npm run dev).');
  });
}

main().catch((err) => {
  console.error('Failed to start HomeSphere server:', err.message);
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    io.close();
    await disconnectDatabase();
    server.close(() => process.exit(0));
  });
}
