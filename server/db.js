import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'birds.db')

let db = null

export function getDb() {
  if (db) return db

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS birds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_cn TEXT NOT NULL,
      description TEXT,
      status TEXT,
      status_code TEXT,
      population_text TEXT,
      population_count INTEGER,
      distribution TEXT,
      video_url TEXT,
      wingspan TEXT,
      weight TEXT,
      lifespan TEXT,
      diet TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bird_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bird_images_bird_id ON bird_images(bird_id);

    CREATE TABLE IF NOT EXISTS bird_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bird_tags_bird_id ON bird_tags(bird_id);

    CREATE TABLE IF NOT EXISTS radar_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_id INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      grade TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_radar_scores_bird_id ON radar_scores(bird_id);
  `)

  return db
}
