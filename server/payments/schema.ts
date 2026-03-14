import db from '../db.js';

/**
 * Inicializa a tabela de doações no SQLite.
 * Chamado no startup do servidor.
 */
export function initDonationsSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      method TEXT NOT NULL CHECK(method IN ('pix', 'card', 'crypto')),
      amount_brl REAL NOT NULL CHECK(amount_brl >= 0),
      amount_crypto REAL,
      crypto_currency TEXT CHECK(crypto_currency IN ('BTC', 'ETH', 'SOL', 'ZEC') OR crypto_currency IS NULL),
      crypto_tx_hash TEXT,
      donor_name TEXT,
      donor_message TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed', 'refunded')),
      is_anonymous INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirmed_at TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
    CREATE INDEX IF NOT EXISTS idx_donations_method ON donations(method);
    CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at);
    CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount_brl);
  `);

  console.log('[Donations] Schema de doações inicializado com sucesso.');
}
