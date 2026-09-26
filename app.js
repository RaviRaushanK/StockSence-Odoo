const fs = require('node:fs');
const path = require('node:path');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { sequelize, verifyConnection } = require('./config/database');
const { AUTH_HIGHLIGHTS, NAV_SECTIONS } = require('./config/navigation');
const routes = require('./routes');
const logger = require('./utils/logger');
const { issueToken, verifyToken } = require('./middleware/csrf');
const { consumeFlash } = require('./middleware/flash');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getInitials, getRoleLabel } = require('./utils/viewHelpers');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

if (env.logRequests) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/app');
app.use(expressLayouts);

app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: env.isProduction ? '7d' : 0 }),
);

/** Resolves the folder that holds a package's distributed assets. */
const vendorDir = (packageName, candidates) => {
  const root = path.dirname(require.resolve(`${packageName}/package.json`));
  const dir = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));

  return dir ? path.join(root, dir) : null;
};

const bootstrapDir = vendorDir('bootstrap', ['dist']);
const bootstrapIconsDir = vendorDir('bootstrap-icons', ['dist/font', 'font']);

if (bootstrapDir) {
  app.use('/vendor/bootstrap', express.static(bootstrapDir));
}

if (bootstrapIconsDir) {
  app.use('/vendor/bootstrap-icons', express.static(bootstrapIconsDir));
}

app.use((req, res, next) => {
  res.locals.appName = env.appName;
  res.locals.appVersion = env.appVersion;
  res.locals.currentPath = req.path;
  res.locals.navSections = NAV_SECTIONS;
  res.locals.authHighlights = AUTH_HIGHLIGHTS;
  res.locals.user = req.user || null;
  res.locals.getInitials = getInitials;
  res.locals.getRoleLabel = getRoleLabel;
  res.locals.flash = consumeFlash(req, res);
  res.locals.errors = {};
  res.locals.values = {};
  res.locals.pageScripts = [];
  res.locals.title = env.appName;
  res.locals.bodyClass = '';

  return next();
});

app.use(issueToken);
app.use(verifyToken);
app.use(
  '/api',
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

const start = async () => {
  try {
    await verifyConnection();
    logger.info(
      `MySQL connection verified (${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name})`,
    );
  } catch (error) {
    logger.error(`MySQL connection failed: ${error.message}`);
    logger.error('Check the DB_* variables in .env and make sure MySQL is running.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`StockSense listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

if (require.main === module) {
  start();
}