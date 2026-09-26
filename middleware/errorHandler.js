const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/** True when the caller expects JSON (API namespace, XHR, or an explicit Accept header). */
const prefersJson = (req) =>
  req.path.startsWith('/api') || req.xhr || !req.accepts('html');

const describe = (error) => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error?.name === 'SequelizeValidationError') {
    return {
      statusCode: 422,
      message: 'Please correct the highlighted fields.',
      code: 'VALIDATION_ERROR',
      details: Object.fromEntries(error.errors.map((item) => [item.path, item.message])),
    };
  }

  if (error?.name === 'SequelizeUniqueConstraintError') {
    return {
      statusCode: 409,
      message: 'A record with these values already exists.',
      code: 'DUPLICATE_RESOURCE',
      details: null,
    };
  }

  if (error?.name === 'SequelizeConnectionError' || error?.name === 'SequelizeAccessDeniedError') {
    return {
      statusCode: 503,
      message: 'The database is currently unavailable. Please try again shortly.',
      code: 'DATABASE_UNAVAILABLE',
      details: null,
    };
  }

  if (error?.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      message: 'Malformed request payload.',
      code: 'BAD_REQUEST',
      details: null,
    };
  }

  return {
    statusCode: 500,
    message: 'Something went wrong. Please try again.',
    code: 'INTERNAL_SERVER_ERROR',
    details: null,
  };
};

const notFound = (req, res, next) => {
  next(ApiError.notFound('The page you are looking for does not exist.'));
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const { statusCode, message, code, details } = describe(error);

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} ${code}`, error);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${code}: ${message}`);
  }

  if (error?.form && !prefersJson(req)) {
    return res.status(statusCode).render(error.form.view, {
      layout: 'layouts/auth',
      title: error.form.title,
      errors: details || {},
      values: error.form.values || {},
    });
  }

  if (prefersJson(req)) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      ...(details ? { errors: details } : {}),
      ...(env.isProduction ? {} : { stack: error?.stack }),
    });
  }

  const view = statusCode === 404 ? 'errors/404' : 'errors/500';
  const is404 = statusCode === 404;

  return res.status(statusCode).render(view, {
    layout: false,
    title: is404 ? 'Page not found' : 'Something went wrong',
    appName: res.locals.appName || env.appName,
    statusCode,
    message: is404 ? message : 'An unexpected error occurred. Please try again.',
    detail: env.isProduction ? '' : message,
  });
};

module.exports = { errorHandler, notFound, prefersJson };
