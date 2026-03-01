import { Router } from 'express';
import { queryAll, queryOne, run } from '../db/database.js';

const router = Router();

interface BlockInput {
  house_id: number;
  date_from: string;
  date_to: string;
  description: string;
}

interface BlockRow {
  id: number;
  house_id: number;
  date_from: string;
  date_to: string;
  description: string;
  created_at: string;
}

/**
 * GET /api/blocks?year=YYYY
 * Gibt alle Sperrzeiten zurück (optional gefiltert nach Jahr)
 */
router.get('/', (req, res) => {
  try {
    const year = req.query.year as string;
    let blocks: BlockRow[];

    if (year) {
      blocks = queryAll<BlockRow>(
        `SELECT * FROM blocks WHERE date_from < ? AND date_to > ? ORDER BY date_from`,
        [`${year}-12-31`, `${year}-01-01`]
      );
    } else {
      blocks = queryAll<BlockRow>('SELECT * FROM blocks ORDER BY date_from');
    }

    res.json({ success: true, data: blocks });
  } catch (error) {
    console.error('Fehler beim Laden der Sperrzeiten:', error);
    res.status(500).json({ success: false, error: 'Fehler beim Laden der Sperrzeiten' });
  }
});

/**
 * POST /api/blocks
 * Erstellt eine neue Sperrzeit
 */
router.post('/', (req, res) => {
  try {
    const { house_id, date_from, date_to, description } = req.body as BlockInput;

    if (!house_id || !date_from || !date_to) {
      return res.status(400).json({ success: false, error: 'house_id, date_from und date_to sind erforderlich' });
    }

    const result = run(
      'INSERT INTO blocks (house_id, date_from, date_to, description) VALUES (?, ?, ?, ?)',
      [house_id, date_from, date_to, description || '']
    );

    const block = queryOne<BlockRow>('SELECT * FROM blocks WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: block });
  } catch (error) {
    console.error('Fehler beim Erstellen der Sperrzeit:', error);
    res.status(500).json({ success: false, error: 'Fehler beim Erstellen der Sperrzeit' });
  }
});

/**
 * PUT /api/blocks/:id
 * Aktualisiert eine Sperrzeit
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { house_id, date_from, date_to, description } = req.body as BlockInput;

    run(
      'UPDATE blocks SET house_id = ?, date_from = ?, date_to = ?, description = ? WHERE id = ?',
      [house_id, date_from, date_to, description || '', id]
    );

    const block = queryOne<BlockRow>('SELECT * FROM blocks WHERE id = ?', [id]);
    if (!block) {
      return res.status(404).json({ success: false, error: 'Sperrzeit nicht gefunden' });
    }

    res.json({ success: true, data: block });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Sperrzeit:', error);
    res.status(500).json({ success: false, error: 'Fehler beim Aktualisieren der Sperrzeit' });
  }
});

/**
 * DELETE /api/blocks/:id
 * Löscht eine Sperrzeit
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM blocks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Sperrzeit:', error);
    res.status(500).json({ success: false, error: 'Fehler beim Löschen der Sperrzeit' });
  }
});

export default router;
