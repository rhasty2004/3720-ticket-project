jest.mock('../setup', () => {
  return {
    openDb: () => {
      const rows = [];
      return {
        run: function () {
          // (sql, params, cb) or (sql, cb)
          const args = Array.from(arguments);
          const cb = args.length > 1 && typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
          // simulate insertion id in this.lastID
          const ctx = { lastID: 42 };
          if (cb) cb.call(ctx, null);
        },
        get: function () {
          // support get(sql, cb) and get(sql, params, cb)
          const args = Array.from(arguments);
          const cb = args.length > 0 && typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
          const row = { id: 42, name: 'New Event', date: '2025-12-01', tickets: 100 };
          if (cb) cb(null, row);
        },
        serialize: (fn) => fn(),
        close: () => {}
      };
    }
  };
});

const model = require('../models/adminModel');
const controller = require('../controllers/adminController');

describe('admin-service', () => {
  test('adminModel.createEvent inserts and returns created row', async () => {
    const ev = { name: 'New Event', date: '2025-12-01', tickets: 100 };
    const row = await model.createEvent(ev);
    expect(row).toBeTruthy();
    expect(row).toHaveProperty('id', 42);
    expect(row).toHaveProperty('name', 'New Event');
  });

  test('adminController.createEvent responds with created id', async () => {
    const req = { body: { name: 'New Event', date: '2025-12-01', tickets: 100 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    await controller.createEvent(req, res);
  expect(res.json).toHaveBeenCalled();
  const arg = res.json.mock.calls[0][0];
  // controller returns { message, event }
  expect(arg).toHaveProperty('message', 'Event created');
  expect(arg).toHaveProperty('event');
  expect(arg.event).toHaveProperty('id', 42);
  });
});

// Additional admin controller tests
describe('adminController edge cases', () => {
  test('createEvent returns 400 on invalid body', async () => {
    const req = { body: { name: '', date: 'not-a-date', tickets: -1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    await controller.createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('error');
  });

  test('createEvent returns 500 if model throws', async () => {
    // temporarily replace the model with a throwing stub
    jest.resetModules();
    jest.doMock('../models/adminModel', () => ({ createEvent: () => { throw new Error('db fail'); } }));
    const controllerReload = require('../controllers/adminController');
    const req = { body: { name: 'OK', date: '2025-12-01', tickets: 10 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    await controllerReload.createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
    // restore modules for other tests
    jest.resetModules();
  });
});
