-- server/src/db/schema.sql
CREATE TABLE IF NOT EXISTS player (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '冒险者',
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  pity_counter INTEGER NOT NULL DEFAULT 0,
  last_completed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily','custom')),
  duration_min INTEGER NOT NULL,
  subject_tag TEXT,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','active','done','failed','expired')),
  daily_date TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id INTEGER NOT NULL REFERENCES quests(id),
  started_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','abandoned')),
  settlement_json TEXT,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_key TEXT NOT NULL UNIQUE,
  qty INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS eggs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  progress INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'incubating' CHECK (status IN ('incubating','hatched')),
  obtained_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS creatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_key TEXT NOT NULL,
  rarity TEXT NOT NULL,
  hatched_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_index INTEGER NOT NULL UNIQUE CHECK (slot_index BETWEEN 0 AND 7),
  building_key TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  built_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
