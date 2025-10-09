const adminModel = require('../models/adminModel');

/*
  validates the data for creating an event
  body - the request body containing event details
  returns null if event is valid or an error message if invalid
*/
function validateEvent(body) {
  if (!body) return 'Missing request body';
  const { name, date, tickets } = body;
  if (!name || typeof name !== 'string') return 'Invalid or missing "name"';
  if (!date || isNaN(Date.parse(date))) return 'Invalid or missing "date"';
  if (!Number.isInteger(tickets) || tickets < 0) return '"tickets" must be a non-negative integer';
  return null;
}

/*
  Creates a new event
  req - request object containing event details in body
  res - response object to send back result
  returns 201 with event data if successful, 400 for validation errors, or 500 for server errors
*/
async function createEvent(req, res) {
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { name, date, tickets } = req.body;
    const isoDate = new Date(date).toISOString();
    const event = await adminModel.createEvent({ name: name.trim(), date: isoDate, tickets });
    return res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createEvent };
