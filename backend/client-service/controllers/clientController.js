const clientModel = require('../models/clientModel');

/*
  retrieve all events and return as JSON
  req - express request object
  res - express response object
  returns JSON response containing events or error message
*/
async function getEvents(req, res) {
  try {
    const events = await clientModel.getAllEvents();
    res.json({ events });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

/*
  purchase a ticket for a given event ID
  req - express request object
  res - express response object
  returns JSON response with ticket purchase result or error message
*/
async function purchaseTicket(req, res) {
  const eventId = parseInt(req.params.id);
  if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

  try {
    const updatedEvent = await clientModel.purchaseTicket(eventId);
    res.json({ message: 'Ticket purchased successfully', event: updatedEvent });
  } catch (err) {
    console.error('purchaseTicket error:', err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getEvents, purchaseTicket };
