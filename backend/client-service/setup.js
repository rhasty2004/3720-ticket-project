const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the shared-db database file
const DB_PATH = path.join(__dirname, '..', 'shared-db', 'database.sqlite');

function setup() {
  return new Promise((resolve, reject) => {
    // Ensure the shared DB exists by opening it. If it doesn't exist, sqlite will create it.
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
      db.close();
      resolve();
    });
  });
}

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = setup;
module.exports.openDb = openDb;
