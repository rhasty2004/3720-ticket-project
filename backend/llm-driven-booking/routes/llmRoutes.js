const express = require('express');
const router = express.Router();
const controller = require('../controllers/llmController');

router.post('/parse', controller.parse);
router.post('/reserve', controller.reserve);
router.post('/confirm', controller.confirm);

module.exports = router;
