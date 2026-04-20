const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    pool: { max: 3, min: 0, acquire: 30000, idle: 10000 },
    logging: false,
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida');
    await sequelize.sync();
    logger.info('✅ Tablas sincronizadas');
  } catch (error) {
    logger.error('❌ Error conectando a PostgreSQL:', error);
    throw error;
  }
}

module.exports = { sequelize, connectDB };