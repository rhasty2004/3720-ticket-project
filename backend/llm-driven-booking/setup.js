const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'shared-db', 'database.sqlite');

function setup() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const createBookings = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        tickets INTEGER NOT NULL CHECK (tickets > 0),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    const createReservations = `
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        tickets INTEGER NOT NULL CHECK (tickets > 0),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;

    db.run(createBookings + createReservations, (err) => {
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
