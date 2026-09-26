const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const env = require('./env');

const ensureDatabase = async () => {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });

  try {
    // DB_NAME comes from your .env configuration.
    // Backticks protect the database name from SQL syntax issues.
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``
    );
  } finally {
    await connection.end();
  }
};

const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    timezone: '+00:00',
    logging: env.db.logging ? (message) => console.log(message) : false,
    define: {
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const verifyConnection = async () => {
  // Make sure the database exists before Sequelize connects to it.
  await ensureDatabase();

  await sequelize.authenticate();

  return true;
};

module.exports = {
  sequelize,
  verifyConnection,
  Sequelize,
};