const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
      pool: { max: 3, min: 0, acquire: 30000, idle: 10000 },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
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