import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'health_data.sqlite');
const db = new Database(dbPath);

// Initialize database schema
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS intelligence_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_json TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    provider TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_sync TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT
  );

  CREATE TABLE IF NOT EXISTS merged_intelligence (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export default db;
