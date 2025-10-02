const dbModule = require('../setup');

function createEvent({ name, date, tickets }) {
  return new Promise((resolve, reject) => {
    const db = dbModule.openDb();
    const sql = `INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)`;
    db.run(sql, [name, date, tickets], function (err) {
      if (err) {
        db.close();
        return reject(err);
      }
      const id = this.lastID;
      db.get(`SELECT * FROM events WHERE id = ?`, [id], (err2, row) => {
        db.close();
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
}

module.exports = { createEvent };
