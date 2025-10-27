const dbModule = require('../setup');

// Find event by case-insensitive name
function findEventByName(name) {
  return new Promise((resolve, reject) => {
    const db = dbModule.openDb();
    db.get('SELECT * FROM events WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Book tickets atomically with transaction and simple retry
function bookEvent({ event, tickets }) {
  const maxAttempts = 5;
  const baseDelay = 50;
  let attempt = 0;

  return new Promise(async (resolve, reject) => {
    const ev = await findEventByName(event);
    if (!ev) return resolve(null);
    const eventId = ev.id;

    function tryOnce() {
      attempt += 1;
      const db = dbModule.openDb();
      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) {
            db.close();
            if (beginErr.code === 'SQLITE_BUSY' && attempt < maxAttempts) {
              return setTimeout(tryOnce, baseDelay * Math.pow(2, attempt - 1));
            }
            return reject(beginErr);
          }

          // check availability
          db.get('SELECT tickets FROM events WHERE id = ?', [eventId], (gerr, row) => {
            if (gerr) {
              return db.run('ROLLBACK', () => { db.close(); reject(gerr); });
            }
            if (!row || row.tickets < tickets) {
              return db.run('ROLLBACK', () => { db.close(); resolve(null); });
            }

            // decrement
            db.run('UPDATE events SET tickets = tickets - ? WHERE id = ?', [tickets, eventId], function (uerr) {
              if (uerr) {
                return db.run('ROLLBACK', () => { db.close(); reject(uerr); });
              }
              // insert booking record
              db.run('INSERT INTO bookings (event_id, tickets) VALUES (?, ?)', [eventId, tickets], function (berr) {
                if (berr) {
                  return db.run('ROLLBACK', () => { db.close(); reject(berr); });
                }
                const bookingId = this.lastID;
                db.get('SELECT * FROM bookings WHERE id = ?', [bookingId], (bkErr, bkRow) => {
                  if (bkErr) return db.run('ROLLBACK', () => { db.close(); reject(bkErr); });
                  db.run('COMMIT', (commitErr) => {
                    db.close();
                    if (commitErr) return reject(commitErr);
                    resolve(bkRow);
                  });
                });
              });
            });
          });
        });
      });
    }

    tryOnce();
  });
}

// Create a reservation record (no decrement). Returns reservation or null if not enough tickets or event not found.
async function createReservation({ event, tickets }) {
  const ev = await findEventByName(event);
  if (!ev) return null;
  if (ev.tickets < tickets) return null;
  const eventId = ev.id;
  return new Promise((resolve, reject) => {
    const db = dbModule.openDb();
    db.run('INSERT INTO reservations (event_id, tickets) VALUES (?, ?)', [eventId, tickets], function (err) {
      db.close();
      if (err) return reject(err);
      const id = this.lastID;
      resolve({ id, event_id: eventId, tickets });
    });
  });
}

// Confirm a reservation: perform transactional decrement and create booking, delete reservation
function confirmReservation({ reservationId }) {
  const maxAttempts = 5;
  const baseDelay = 50;
  let attempt = 0;

  return new Promise((resolve, reject) => {
    function tryOnce() {
      attempt += 1;
      const db = dbModule.openDb();
      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) {
            db.close();
            if (beginErr.code === 'SQLITE_BUSY' && attempt < maxAttempts) {
              return setTimeout(tryOnce, baseDelay * Math.pow(2, attempt - 1));
            }
            return reject(beginErr);
          }

          // read reservation
          db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (rerr, resRow) => {
            if (rerr) return db.run('ROLLBACK', () => { db.close(); reject(rerr); });
            if (!resRow) return db.run('ROLLBACK', () => { db.close(); resolve(null); });

            const { event_id, tickets } = resRow;
            // check availability
            db.get('SELECT tickets FROM events WHERE id = ?', [event_id], (gerr, evRow) => {
              if (gerr) return db.run('ROLLBACK', () => { db.close(); reject(gerr); });
              if (!evRow || evRow.tickets < tickets) return db.run('ROLLBACK', () => { db.close(); resolve(null); });

              // decrement
              db.run('UPDATE events SET tickets = tickets - ? WHERE id = ?', [tickets, event_id], function (uerr) {
                if (uerr) return db.run('ROLLBACK', () => { db.close(); reject(uerr); });
                // insert booking
                db.run('INSERT INTO bookings (event_id, tickets) VALUES (?, ?)', [event_id, tickets], function (berr) {
                  if (berr) return db.run('ROLLBACK', () => { db.close(); reject(berr); });
                  const bookingId = this.lastID;
                  // delete reservation
                  db.run('DELETE FROM reservations WHERE id = ?', [reservationId], function (derr) {
                    if (derr) return db.run('ROLLBACK', () => { db.close(); reject(derr); });
                    db.get('SELECT * FROM bookings WHERE id = ?', [bookingId], (bkErr, bkRow) => {
                      if (bkErr) return db.run('ROLLBACK', () => { db.close(); reject(bkErr); });
                      db.run('COMMIT', (commitErr) => {
                        db.close();
                        if (commitErr) return reject(commitErr);
                        resolve(bkRow);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }

    tryOnce();
  });
}

module.exports = { findEventByName, bookEvent, createReservation, confirmReservation };


