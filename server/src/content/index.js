import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (file) => JSON.parse(readFileSync(path.join(__dirname, file), 'utf8'));

export const MATERIALS = load('materials.json');
export const SPECIES = load('species.json');
export const BUILDINGS = load('buildings.json');
export const QUEST_TEMPLATES = load('quest-templates.json');
export const TITLES = load('titles.json');

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map(m => [m.key, m]));
export const SPECIES_MAP = Object.fromEntries(SPECIES.map(s => [s.key, s]));
export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map(b => [b.key, b]));

export const RARITY_WEIGHTS = { common: 70, rare: 22, epic: 7, legendary: 1 };
export const HATCH_REQUIRED = { common: 3, rare: 5, epic: 8, legendary: 12 };
