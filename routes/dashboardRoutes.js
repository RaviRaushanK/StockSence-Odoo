const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authenticate');

const router = express.Router();

router.get('/dashboard', requireAuth, dashboardController.index);
router.get('/products', requireAuth, dashboardController.products);
router.get('/warehouses', requireAuth, dashboardController.warehouses);
router.get('/receipts', requireAuth, dashboardController.receipts);
router.get('/deliveries', requireAuth, dashboardController.deliveries);
router.get('/transfers', requireAuth, dashboardController.transfers);
router.get('/adjustments', requireAuth, dashboardController.adjustments);
router.get('/move-history', requireAuth, dashboardController.moveHistory);
router.get('/settings', requireAuth, dashboardController.settings);

module.exports = router;