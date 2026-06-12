import { Router } from 'express';
import { SPECIES } from '../content/index.js';

export function createCollectionRouter({ db }) {
  const router = Router();
  router.get('/', (req, res, next) => {
    try {
      const counts = Object.fromEntries(
        db.prepare('SELECT species_key, COUNT(*) AS c FROM creatures GROUP BY species_key').all().map(r => [r.species_key, r.c])
      );
      const species = SPECIES.map(s => ({ ...s, collected: !!counts[s.key], count: counts[s.key] || 0 }));
      res.json({ species, progress: { collected: Object.keys(counts).length, total: SPECIES.length } });
    } catch (e) { next(e); }
  });
  return router;
}
