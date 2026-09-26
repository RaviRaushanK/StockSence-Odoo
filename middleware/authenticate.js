const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const tokenService = require('../services/tokenService');
const { flashError } = require('./flash');

/** Resolves the signed-in user from the HttpOnly cookie, or throws a 401. */
const resolveUser = async (req) => {
  const token = tokenService.extractToken(req);
  const payload = tokenService.verifyToken(token);

  const user = await User.findByPk(payload.sub);

  if (!user) {
    throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
  }

  return user;
};

const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  return error;
};

const clearAuthCookie = (res) => tokenService.clearAuthCookie(res);

/** Browser guard: redirects anonymous visitors to the login page. */
const requireAuth = async (req, res, next) => {
  try {
    const user = await resolveUser(req);

    req.user = user;
    req.userId = user.id;

    return next();
  } catch (error) {
    const normalized = normalizeError(error);

    if (normalized instanceof ApiError && normalized.statusCode === 401) {
      clearAuthCookie(res);
      flashError(res, normalized.message);
      return res.redirect('/login');
    }

    return next(normalized);
  }
};

/** Guest guard: sends already signed-in users to the dashboard. */
const redirectIfAuthenticated = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    req.user = user;
    return res.redirect('/dashboard');
  } catch (error) {
    const normalized = normalizeError(error);

    if (normalized instanceof ApiError && normalized.statusCode === 401) {
      clearAuthCookie(res);
      return next();
    }

    return next(normalized);
  }
};

module.exports = { redirectIfAuthenticated, requireAuth };
