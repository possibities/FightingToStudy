import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/index.js';

describe('createDb', () => {
  it('creates all tables', () => {
    const db = createDb(':memory:');
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    for (const t of ['player', 'quests', 'sessions', 'inventory', 'eggs', 'creatures', 'buildings', 'settings'])
      expect(names).toContain(t);
  });
});
