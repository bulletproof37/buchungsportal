import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';
import housesRouter from './routes/houses.js';
import bookingsRouter from './routes/bookings.js';
import settingsRouter from './routes/settings.js';
import statisticsRouter from './routes/statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Server starten
async function startServer() {
  try {
    // Datenbank initialisieren (asynchron für sql.js)
    console.log('Initialisiere Datenbank...');
    await initDatabase();
    runMigrations();
    seedDatabase();

    // API-Routen
    app.use('/api/houses', housesRouter);
    app.use('/api/bookings', bookingsRouter);
    app.use('/api/settings', settingsRouter);
    app.use('/api/statistics', statisticsRouter);

    // Health-Check Endpunkt
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // In Produktion: Statische Dateien des Frontends ausliefern
    if (process.env.NODE_ENV === 'production') {
      const clientDistPath = path.join(__dirname, '../../client/dist');
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
