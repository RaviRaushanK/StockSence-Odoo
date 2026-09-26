const express = require('express');
const receiptController = require('../controllers/receiptController');
const deliveryController = require('../controllers/deliveryController');
const transferController = require('../controllers/transferController');
const adjustmentController = require('../controllers/adjustmentController');
const { requireAuth } = require('../middleware/authenticate');

const router = express.Router();

router.get('/operations/receipts', requireAuth, receiptController.list);
router.get('/operations/receipts/create', requireAuth, receiptController.showCreate);
router.post('/operations/receipts/create', requireAuth, receiptController.create);
router.get('/operations/receipts/locations/:warehouseId', requireAuth, receiptController.locations);
router.get('/operations/receipts/:id', requireAuth, receiptController.show);
router.post('/operations/receipts/:id/validate', requireAuth, receiptController.validate);
router.post('/operations/receipts/:id/cancel', requireAuth, receiptController.cancel);

router.get('/operations/deliveries', requireAuth, deliveryController.list);
router.get('/operations/deliveries/create', requireAuth, deliveryController.showCreate);
router.post('/operations/deliveries/create', requireAuth, deliveryController.create);
router.get('/operations/deliveries/:id', requireAuth, deliveryController.show);
router.post('/operations/deliveries/:id/validate', requireAuth, deliveryController.validate);
router.post('/operations/deliveries/:id/cancel', requireAuth, deliveryController.cancel);

router.get('/operations/transfers', requireAuth, transferController.list);
router.get('/operations/transfers/create', requireAuth, transferController.showCreate);
router.post('/operations/transfers/create', requireAuth, transferController.create);
router.get('/operations/transfers/:id', requireAuth, transferController.show);
router.post('/operations/transfers/:id/validate', requireAuth, transferController.validate);
router.post('/operations/transfers/:id/cancel', requireAuth, transferController.cancel);

router.get('/operations/adjustments', requireAuth, adjustmentController.list);
router.get('/operations/adjustments/create', requireAuth, adjustmentController.showCreate);
router.post('/operations/adjustments/create', requireAuth, adjustmentController.create);
router.get('/operations/adjustments/:id', requireAuth, adjustmentController.show);
router.post('/operations/adjustments/:id/validate', requireAuth, adjustmentController.validate);
router.post('/operations/adjustments/:id/cancel', requireAuth, adjustmentController.cancel);

router.get('/receipts', requireAuth, (req, res) => res.redirect('/operations/receipts'));
router.get('/deliveries', requireAuth, (req, res) => res.redirect('/operations/deliveries'));
router.get('/transfers', requireAuth, (req, res) => res.redirect('/operations/transfers'));
router.get('/adjustments', requireAuth, (req, res) => res.redirect('/operations/adjustments'));

module.exports = router;
