const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const verifyPassword = (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword);

const signToken = (user) =>
  jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, issuer: env.jwt.issuer },
  );

const verifyToken = (token) => jwt.verify(token, env.jwt.secret, { issuer: env.jwt.issuer });

const setAuthCookie = (res, token, { persistent = false } = {}) => {
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
    ...(persistent ? { maxAge: TOKEN_TTL_MS } : {}),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(env.cookie.name, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
  });
};

const extractToken = (req) => {
  const cookieToken = req.cookies?.[env.cookie.name];
  if (cookieToken) return cookieToken;

  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();

  throw ApiError.unauthorized('Session not found. Please sign in again.');
};

module.exports = {
  clearAuthCookie,
  extractToken,
  hashPassword,
  setAuthCookie,
  signToken,
  verifyPassword,
  verifyToken,
};
