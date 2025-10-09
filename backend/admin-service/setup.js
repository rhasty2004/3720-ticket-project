const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'events.db');

/* Ensure data directory exists and creates events
    table if it doesn't exist
    returns a promise that resolves when setup is complete
*/
function setup() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const db = new sqlite3.Database(DB_PATH);
    const createTable = `
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        tickets INTEGER NOT NULL CHECK (tickets >= 0),
        created_at TEXT DEFAULT (datetime('now'))
      )
    `;
    db.run(createTable, (err) => {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = setup;
module.exports.openDb = openDb;
