const { sequelize, verifyConnection } = require('../config/database');
require('../models');
const logger = require('../utils/logger');

const run = async () => {
  try {
    await verifyConnection();
    await sequelize.sync();
    logger.info('Models synchronized. Tables are ready.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Model synchronization failed: ${error.message}`);
    process.exit(1);
  }
};

run();