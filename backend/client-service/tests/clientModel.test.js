jest.mock('../setup', () => {
  // provide a fake openDb that returns an object with run/get/all methods
  return {
    openDb: () => {
      const rows = [ { id: 1, name: 'Concert A', tickets: 5, date: '2025-10-28' } ];
      return {
        all: (sql, cb) => cb(null, rows),
        get: (sql, params, cb) => cb(null, rows[0]),
        run: (sql, params, cb) => {
          // emulate sqlite run with function context 'this' containing changes
          const fn = cb;
          const ctx = { changes: 1 };
          if (typeof fn === 'function') fn.call(ctx, null);
        },
        serialize: (fn) => fn(),
        close: () => {}
      };
    }
  };
});

const model = require('../models/clientModel');

describe('clientModel', () => {
  test('getAllEvents returns rows', async () => {
    const rows = await model.getAllEvents();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0].name).toBe('Concert A');
  });

  test('purchaseTicket returns updated row on success', async () => {
    const updated = await model.purchaseTicket(1);
    expect(updated).toBeTruthy();
    expect(updated.name).toBe('Concert A');
  });
});
