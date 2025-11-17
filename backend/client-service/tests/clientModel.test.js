jest.mock('../setup', () => {
  // provide a fake openDb that returns an object with run/get/all methods
  return {
    openDb: () => {
      const rows = [ { id: 1, name: 'Concert A', tickets: 5, date: '2025-10-28' } ];
      return {
        all: (sql, cb) => cb(null, rows),
        get: function () {
          const args = Array.from(arguments);
          const cb = args.length > 1 && typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
          if (cb) cb(null, rows[0]);
        },
        run: function () {
          // flexible: (sql, cb) or (sql, params, cb)
          const args = Array.from(arguments);
          const cb = args.length > 1 && typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
          const ctx = { changes: 1 };
          if (cb) cb.call(ctx, null);
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

// Additional edge-case test: no tickets available should return null
describe('clientModel edge cases', () => {
  test('purchaseTicket returns null when no tickets available', async () => {
    // isolate module and provide a specialized mock for this test
    jest.resetModules();
    jest.doMock('../setup', () => ({
      openDb: () => ({
        serialize: (fn) => fn(),
        run: function (sql, params, cb) {
          // BEGIN/ROLLBACK/COMMIT callbacks
          if (/BEGIN/i.test(sql) || /ROLLBACK/i.test(sql) || /COMMIT/i.test(sql)) {
            const fnc = typeof params === 'function' ? params : cb;
            if (fnc) return fnc(null);
            return;
          }
          if (/UPDATE\s+events/i.test(sql)) {
            const fnc = typeof cb === 'function' ? cb : (typeof params === 'function' ? params : null);
            if (fnc) return fnc.call({ changes: 0 }, null);
            return;
          }
          const fnc = typeof cb === 'function' ? cb : (typeof params === 'function' ? params : null);
          if (fnc) fnc(null);
        },
        get: (sql, params, cb) => {
          const row = { id: 1, name: 'Concert A', tickets: 0, date: '2025-10-28' };
          const fnc = typeof cb === 'function' ? cb : (typeof params === 'function' ? params : null);
          if (fnc) fnc(null, row);
        },
        all: (sql, cb) => cb(null, []),
        close: () => {}
      })
    }));

    const modelLocal = require('../models/clientModel');
    const res = await modelLocal.purchaseTicket(1);
    expect(res).toBeNull();

    // reset modules so top-level mocks remain consistent for other tests
    jest.resetModules();
  });
});
