const express = require('express');

const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const locationRoutes = require('./locationRoutes');
const pageRoutes = require('./pageRoutes');
const productRoutes = require('./productRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const { apiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/api/health', apiLimiter, (req, res) => {
  res.json({
    success: true,
    message: 'StockSense API is running.',
    data: { status: 'ok' },
  });
});

router.use(pageRoutes);
router.use(authRoutes);
router.use(dashboardRoutes);
router.use(categoryRoutes);
router.use(productRoutes);
router.use(warehouseRoutes);
router.use(locationRoutes);

module.exports = router;
