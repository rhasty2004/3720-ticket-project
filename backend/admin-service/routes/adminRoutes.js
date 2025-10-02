const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// POST /api/admin/events
router.post('/events', adminController.createEvent);

module.exports = router;
