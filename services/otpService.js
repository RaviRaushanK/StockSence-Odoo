const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const mailService = require('./mailService');
const tokenService = require('./tokenService');
const PasswordResetToken = require('../models/PasswordResetToken');
const User = require('../models/User');

const OTP_NOT_CONFIGURED =
  'Password reset email could not be sent right now. Please try again later.';

const isDeliveryConfigured = () => mailService.isMailConfigured();

const OTP_TTL_MS = () => Math.max(1, env.otp.expiryMinutes) * 60 * 1000;
const OTP_MAX_ATTEMPTS = () => Math.max(1, env.otp.maxAttempts);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const generateOtp = () => {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += String(crypto.randomInt(0, 10));
  }
  return code;
};

const latestToken = (email) =>
  PasswordResetToken.findOne({ where: { email }, order: [['createdAt', 'DESC']] });

const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw ApiError.unprocessable('Please correct the highlighted fields.', {
      email: 'Email address is required.',
    });
  }

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return { success: true, delivered: false };
  }

  if (!mailService.isMailConfigured()) {
    logger.warn('OTP requested but mail is not configured.');
    throw ApiError.serviceUnavailable(OTP_NOT_CONFIGURED, 'OTP_NOT_CONFIGURED');
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS());

  await PasswordResetToken.destroy({ where: { email: normalizedEmail } });
  await PasswordResetToken.create({ email: normalizedEmail, otpHash, expiresAt });

  try {
    await mailService.sendOtpEmail({ to: normalizedEmail, otp, expiryMinutes: env.otp.expiryMinutes });
  } catch (error) {
    await PasswordResetToken.destroy({ where: { email: normalizedEmail } });
    throw ApiError.serviceUnavailable(
      'Password reset email could not be sent right now. Please try again later.',
      'OTP_SEND_FAILED',
    );
  }

  return { success: true, delivered: true };
};

const verifyOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const code = String(otp || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw ApiError.unprocessable('Please correct the highlighted fields.', {
      otp: 'Enter the 6-digit OTP.',
    });
  }

  const record = await latestToken(normalizedEmail);
  if (!record || record.consumedAt) {
    throw ApiError.badRequest('The OTP is invalid or has expired. Request a new one.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.destroy();
    throw ApiError.badRequest('The OTP has expired. Request a new one.');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS()) {
    await record.destroy();
    throw ApiError.badRequest('Too many incorrect attempts. Request a new OTP.');
  }

  const matches = await bcrypt.compare(code, record.otpHash);
  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw ApiError.badRequest('The OTP is invalid or has expired. Request a new one.');
  }

  record.verified = true;
  await record.save();
  return { success: true };
};

const resetPassword = async ({ email, otp, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const code = String(otp || '').trim();

  const record = await latestToken(normalizedEmail);
  if (!record || record.consumedAt) {
    throw ApiError.badRequest('The OTP is invalid or has expired. Request a new one.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.destroy();
    throw ApiError.badRequest('The OTP has expired. Request a new one.');
  }

  const matches = await bcrypt.compare(code, record.otpHash);
  if (!matches || !record.verified) {
    throw ApiError.badRequest('Verify the OTP before resetting the password.');
  }

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw ApiError.badRequest('The OTP is invalid or has expired. Request a new one.');
  }

  user.password = await tokenService.hashPassword(password);
  await user.save();

  await PasswordResetToken.destroy({ where: { email: normalizedEmail } });
  return { success: true };
};

module.exports = {
  OTP_NOT_CONFIGURED,
  isDeliveryConfigured,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
};
