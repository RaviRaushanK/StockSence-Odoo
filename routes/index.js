const express = require('express');

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const pageRoutes = require('./pageRoutes');
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

module.exports = router;