const crypto = require('node:crypto');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const CSRF_COOKIE = 'ss_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_BYTES = 32;

const sign = (value) =>
  crypto.createHmac('sha256', env.jwt.secret).update(value).digest('base64url');

const isValid = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [value, signature] = token.split('.');
  return sign(value) === signature;
};

/** Issues a signed double-submit CSRF token and exposes it to the views. */
const issueToken = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE];

  if (!isValid(token)) {
    const value = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
    token = `${value}.${sign(value)}`;

    res.cookie(CSRF_COOKIE, token, {
      httpOnly: true,
      secure: env.cookie.secure,
      sameSite: env.cookie.sameSite,
      path: '/',
    });
  }

  res.locals.csrfToken = token;

  return next();
};

/** Rejects state-changing requests whose hidden token does not match the cookie. */
const verifyToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const submitted = req.body?._csrf;

  if (isValid(cookieToken) && cookieToken === submitted) {
    return next();
  }

  return next(
    new ApiError(403, 'Your session could not be verified. Please try again.', {
      code: 'CSRF_INVALID',
    }),
  );
};

module.exports = { CSRF_COOKIE, issueToken, verifyToken };