const path = require('node:path');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toList = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const port = toNumber(process.env.PORT, 5000);

const jwtSecret = process.env.JWT_SECRET || '';

if (isProduction) {
  const missing = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'].filter(
    (key) => !process.env[key],
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Reference .env.example.`,
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
}

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOrigins = toList(process.env.CORS_ORIGINS, [
  clientUrl,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);

const env = {
  nodeEnv,
  isProduction,
  port,
  appName: process.env.APP_NAME || 'StockSense',
  appVersion: process.env.APP_VERSION || '1.0.0',
  clientUrl,
  corsOrigins,
  logRequests: !isProduction,
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    issuer: process.env.JWT_ISSUER || 'stocksense-api',
  },
  cookie: {
    name: process.env.COOKIE_NAME || 'ss_access_token',
    secure: toBoolean(process.env.COOKIE_SECURE, isProduction),
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'stocksense',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: toBoolean(process.env.DB_LOG_SQL, false),
  },
  mail: {
    host: process.env.MAIL_HOST || '',
    port: toNumber(process.env.MAIL_PORT, 587),
    secure: toBoolean(process.env.MAIL_SECURE, false),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'StockSense <no-reply@example.com>',
  },
  otp: {
    expiryMinutes: toNumber(process.env.OTP_EXPIRY_MINUTES, 10),
    maxAttempts: toNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  },
};

module.exports = env;
