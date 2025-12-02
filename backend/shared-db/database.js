const path = require('path');
const fs = require('fs');


/**
 * Initialize and return a database instance.
 * @param {object} sqlite3 - The sqlite3 module passed from the microservice.
 * @param {string} dbFileName - Optional database file name
 * @returns {object} db instance
 */
function initDb(sqlite3, dbFileName = 'database.sqlite') {
  if (!sqlite3) {
    throw new Error('sqlite3 module must be provided by the calling microservice');
  }

  const dbPath = path.join(__dirname, dbFileName);
  const db = new sqlite3.Database(dbPath);

  // Initialize database with schema
  const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
  db.exec(initSQL, (err) => {
    if (err) {
      console.error('Error initializing database:', err);
    } else {
      console.log('Database initialized successfully');
    }
  });

  return db;
}

module.exports = { initDb };

/*const sqlite3 = require('sqlite3').verbose();



const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
db.exec(initSQL, (err) => {
  if (err) {
    console.error('Error initializing database:', err);
  } else {
    console.log('Database initialized successfully');
  }
});

module.exports = db;*/