const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the shared DB file so admin and client services operate on the same database
const DB_PATH = path.join(__dirname, '..', 'shared-db', 'database.sqlite');

// Initialize the shared DB (creates file if missing) and create the events table if needed
function setup() {
  return new Promise((resolve, reject) => {
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
