const express = require('express');

const inventoryController = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/authenticate');

const router = express.Router();

router.get('/inventory', requireAuth, inventoryController.stockOverview);
router.get('/move-history', requireAuth, inventoryController.moveHistory);

module.exports = router;
