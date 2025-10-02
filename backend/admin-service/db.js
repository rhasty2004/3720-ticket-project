const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'events.db');

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

function init() {
  return new Promise((resolve, reject) => {
    // ensure data dir exists
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const db = openDb();
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        tickets INTEGER NOT NULL CHECK (tickets >= 0),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    db.run(createTableSQL, (err) => {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { DB_PATH, openDb, init };
