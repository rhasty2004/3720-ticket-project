const dbModule = require('../setup');

/*
  retrieve all events from the database
*/
function getAllEvents() {
  return new Promise((resolve, reject) => {
    const db = dbModule.openDb();
    db.all('SELECT * FROM events', (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/*
  purchase a ticket for a given event ID, deals with concurrency using retries
  eventId - ID of the event to purchase a ticket for
  returns a promise that resolves with updated event data or rejects with an error
*/
function purchaseTicket(eventId) {
  const maxAttempts = 5;
  const baseDelay = 50; // ms

  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryOnce() {
      attempt += 1;
      const db = dbModule.openDb();

      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) {
            db.close();
            // retry on SQLITE_BUSY
            if (beginErr.code === 'SQLITE_BUSY' && attempt < maxAttempts) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              return setTimeout(tryOnce, delay);
            }
            return reject(beginErr);
          }

          db.run(
            'UPDATE events SET tickets = tickets - 1 WHERE id = ? AND tickets > 0',
            [eventId],
            function (updateErr) {
              if (updateErr) {
                // rollback and possibly retry on busy
                return db.run('ROLLBACK', () => {
                  db.close();
                  if (updateErr.code === 'SQLITE_BUSY' && attempt < maxAttempts) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    return setTimeout(tryOnce, delay);
                  }
                  return reject(updateErr);
                });
              }

              if (this.changes === 0) {
                // nothing updated. no tickets or not found
                return db.run('ROLLBACK', () => {
                  db.close();
                  return resolve(null);
                });
              }

              // read updated row
              db.get('SELECT * FROM events WHERE id = ?', [eventId], (getErr, updatedRow) => {
                if (getErr) {
                  return db.run('ROLLBACK', () => {
                    db.close();
                    return reject(getErr);
                  });
                }

                db.run('COMMIT', (commitErr) => {
                  db.close();
                  if (commitErr) {
                    // If commit failed due to busy, optionally retry
                    if (commitErr.code === 'SQLITE_BUSY' && attempt < maxAttempts) {
                      const delay = baseDelay * Math.pow(2, attempt - 1);
                      return setTimeout(tryOnce, delay);
                    }
                    return reject(commitErr);
                  }
                  return resolve(updatedRow);
                });
              });
            }
          );
        });
      });
    }

    tryOnce();
  });
}

module.exports = { getAllEvents, purchaseTicket };
