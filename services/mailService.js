const nodemailer = require('nodemailer');

const env = require('../config/env');
const logger = require('../utils/logger');

let cachedTransporter = null;

const isMailConfigured = () =>
  Boolean(env.mail.host && env.mail.user && env.mail.password);

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.password,
    },
  });
  return cachedTransporter;
};

const verifyConnection = async () => {
  if (!isMailConfigured()) {
    throw new Error('Mail is not configured. Set MAIL_HOST, MAIL_USER and MAIL_PASSWORD.');
  }
  await getTransporter().verify();
  return true;
};

const sendOtpEmail = async ({ to, otp, expiryMinutes }) => {
  if (!isMailConfigured()) {
    throw new Error('Mail is not configured. Set MAIL_HOST, MAIL_USER and MAIL_PASSWORD.');
  }
  const mailOptions = {
    from: env.mail.from,
    to,
    subject: `${env.appName} password reset code`,
    text:
      `Your ${env.appName} password reset code is ${otp}.\n\n` +
      `It expires in ${expiryMinutes} minutes. If you did not request this, ignore this email.`,
    html:
      `<p>Your <strong>${env.appName}</strong> password reset code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px;">${otp}</p>` +
      `<p>This code expires in ${expiryMinutes} minutes. If you did not request it, ignore this email.</p>`,
  };
  try {
    await getTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    logger.error(`OTP email delivery failed to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { getTransporter, isMailConfigured, sendOtpEmail, verifyConnection };
