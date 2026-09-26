const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const tokenService = require('./tokenService');
const otpService = require('./otpService');

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const register = async ({ fullName, email, password, role }) => {
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_REGISTERED');
  }

  const hashedPassword = await tokenService.hashPassword(password);

  try {
    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'WAREHOUSE_STAFF',
    });

    return toPublicUser(user);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_REGISTERED');
    }
    throw error;
  }
};

const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.scope('withPassword').findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const passwordMatches = await tokenService.verifyPassword(password, user.password);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
  }

  return { user: toPublicUser(user), token: tokenService.signToken(user) };
};

const getProfile = async (userId) => {
  const user = await User.scope('withPassword').findOne({ where: { id: userId } });

  if (!user) {
    throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
  }

  return toPublicUser(user);
};

module.exports = {
  getProfile,
  login,
  normalizeEmail,
  register,
  requestPasswordReset: otpService.requestPasswordReset,
  resetPassword: otpService.resetPassword,
  toPublicUser,
  verifyOtp: otpService.verifyOtp,
};
