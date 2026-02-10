import { Router } from 'express';
import { queryAll, queryOne, run } from '../db/database.js';

const router = Router();

interface House {
  id: number;
  name: string;
  price_per_night: number;
  sort_order: number;
}

/**
 * GET /api/houses
 * Gibt alle Ferienhäuser zurück
 */
router.get('/', (_req, res) => {
  try {
    const houses = queryAll<House>(`
      SELECT id, name, price_per_night, sort_order
      FROM houses
      ORDER BY sort_order ASC
    `);

    res.json({
      success: true,
      data: houses
    });
  } catch (error) {
    console.error('Fehler beim Laden der Häuser:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Häuser'
    });
  }
});

/**
 * GET /api/houses/:id
 * Gibt ein einzelnes Ferienhaus zurück
 */
router.get('/:id', (req, res) => {
  try {
    const house = queryOne<House>(
      'SELECT id, name, price_per_night, sort_order FROM houses WHERE id = ?',
      [parseInt(req.params.id)]
    );

    if (!house) {
      return res.status(404).json({
        success: false,
        error: 'Ferienhaus nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: house
    });
  } catch (error) {
    console.error('Fehler beim Laden des Hauses:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Hauses'
    });
  }
});

/**
 * PUT /api/houses/:id
 * Aktualisiert den Nachtpreis eines Ferienhauses
 */
router.put('/:id', (req, res) => {
  try {
    const { price_per_night } = req.body;

    const result = run(
      'UPDATE houses SET price_per_night = ? WHERE id = ?',
      [price_per_night, parseInt(req.params.id)]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ferienhaus nicht gefunden'
      });
    }

    const house = queryOne<House>(
      'SELECT id, name, price_per_night, sort_order FROM houses WHERE id = ?',
      [parseInt(req.params.id)]
    );

    res.json({
      success: true,
      data: house
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Hauses:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren des Hauses'
    });
  }
});

export default router;
