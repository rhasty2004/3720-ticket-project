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
  purchase a ticket for a given event ID
  eventId - ID of the event to purchase a ticket for
  returns a promise that resolves with updated event data or rejects with an error
*/
function purchaseTicket(eventId) {
  return new Promise((resolve, reject) => {
    const db = dbModule.openDb();
    // Check current ticket count
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, row) => {
      if (err) {
        db.close();
        return reject(err);
      }
      if (!row) {
        db.close();
        return reject(new Error('Event not found'));
      }
      if (row.tickets <= 0) {
        db.close();
        return reject(new Error('No tickets left'));
      }
      const newTickets = row.tickets - 1;
      db.run('UPDATE events SET tickets = ? WHERE id = ?', [newTickets, eventId], function (err2) {
        if (err2) {
          db.close();
          return reject(err2);
        }
        db.get('SELECT * FROM events WHERE id = ?', [eventId], (err3, updatedRow) => {
          db.close();
          if (err3) return reject(err3);
          resolve(updatedRow);
        });
      });
    });
  });
}

module.exports = { getAllEvents, purchaseTicket };
