const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authenticate');

const router = express.Router();

router.get('/dashboard', requireAuth, dashboardController.index);
router.get('/settings', requireAuth, dashboardController.settings);

module.exports = router;

