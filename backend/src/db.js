import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

export function openDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "relayer.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS allowlist (
      address TEXT PRIMARY KEY COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS commit_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_address TEXT NOT NULL COLLATE NOCASE,
      commitment TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      signature TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      tx_hash TEXT,
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commit_queue_status ON commit_queue(status);
  `);

  return db;
}

export function seedAllowlist(db, addresses) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO allowlist (address) VALUES (?)"
  );
  const run = db.transaction((addrs) => {
    for (const a of addrs) {
      if (a && a.startsWith("0x")) insert.run(a.toLowerCase());
    }
  });
  run(addresses);
}

export function isAllowlisted(db, address) {
  const row = db
    .prepare("SELECT 1 FROM allowlist WHERE address = ?")
    .get(address.toLowerCase());
  return Boolean(row);
}

export function logAudit(db, eventType, payloadObj) {
  const now = Date.now();
  db.prepare(
    "INSERT INTO audit_logs (event_type, payload, created_at) VALUES (?, ?, ?)"
  ).run(eventType, JSON.stringify(payloadObj ?? {}), now);
}
