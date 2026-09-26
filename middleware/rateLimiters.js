const { rateLimit } = require('express-rate-limit');

const env = require('../config/env');
const { prefersJson } = require('./errorHandler');

const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a few minutes and try again.';

/** Renders a styled page for browsers and the JSON envelope for API clients. */
const handler = (req, res) => {
  if (prefersJson(req)) {
    return res.status(429).json({ success: false, message: RATE_LIMIT_MESSAGE, code: 'RATE_LIMITED' });
  }

  return res.status(429).render('errors/429', {
    layout: false,
    title: 'Too many requests',
    message: RATE_LIMIT_MESSAGE,
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 20 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 300 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

module.exports = { apiLimiter, authLimiter };
