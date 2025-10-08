const clientModel = require('../models/clientModel');

async function getEvents(req, res) {
  try {
    const events = await clientModel.getAllEvents();
    res.json({ events });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

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
