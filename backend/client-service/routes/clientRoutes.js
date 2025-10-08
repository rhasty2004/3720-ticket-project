const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// GET /api/events
router.get('/events', clientController.getEvents);

// POST /api/events/:id/purchase
router.post('/events/:id/purchase', clientController.purchaseTicket);

module.exports = router;
