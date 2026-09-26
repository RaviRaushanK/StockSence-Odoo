const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const OTP_NOT_CONFIGURED =
  'Password recovery is not available yet: outbound email delivery is not configured on the server. Set the MAIL_* environment variables to enable the OTP workflow.';

const isDeliveryConfigured = () => Boolean(env.mail.host && env.mail.user && env.mail.password);

const assertDeliveryConfigured = () => {
  if (!isDeliveryConfigured()) {
    throw ApiError.serviceUnavailable(OTP_NOT_CONFIGURED, 'OTP_NOT_CONFIGURED');
  }
};

const requestPasswordReset = async () => {
  assertDeliveryConfigured();
  throw ApiError.serviceUnavailable(
    'The OTP delivery integration is reserved for a later phase.',
    'OTP_NOT_IMPLEMENTED',
  );
};

const verifyOtp = async () => {
  assertDeliveryConfigured();
  throw ApiError.serviceUnavailable(
    'The OTP delivery integration is reserved for a later phase.',
    'OTP_NOT_IMPLEMENTED',
  );
};

const resetPassword = async () => {
  assertDeliveryConfigured();
  throw ApiError.serviceUnavailable(
    'The OTP delivery integration is reserved for a later phase.',
    'OTP_NOT_IMPLEMENTED',
  );
};

module.exports = {
  OTP_NOT_CONFIGURED,
  isDeliveryConfigured,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
};
