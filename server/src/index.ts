import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';
import { startAutoBackup } from './services/backup.js';
import housesRouter from './routes/houses.js';
import bookingsRouter from './routes/bookings.js';
import settingsRouter from './routes/settings.js';
import statisticsRouter from './routes/statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: nur lokale Ursprünge erlauben
app.use(cors({
  origin: [
    `http://localhost:5173`,  // Vite dev server
    `http://localhost:${PORT}`,
    `http://127.0.0.1:5173`,
    `http://127.0.0.1:${PORT}`,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Server starten
function startServer() {
  try {
    console.log('Initialisiere Datenbank...');
    initDatabase();
    runMigrations();
    seedDatabase();
    startAutoBackup();

    // API-Routen
    app.use('/api/houses', housesRouter);
    app.use('/api/bookings', bookingsRouter);
    app.use('/api/settings', settingsRouter);
    app.use('/api/statistics', statisticsRouter);

    // Health-Check Endpunkt
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Statische Dateien des Frontends ausliefern (wenn gebaut)
    const clientDistPath = path.join(__dirname, '../../client/dist');
    if (fs.existsSync(clientDistPath)) {
      app.use(express.static(clientDistPath));

      // Alle anderen Routen zum Frontend weiterleiten (SPA)
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }

    // Server starten
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Buchungsportal - Bioferienhof Loreley                   ║
║                                                            ║
║   Server laeuft auf: http://localhost:${PORT}                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
}

startServer();

export default app;
