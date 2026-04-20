const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
      { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false }
    );

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida');
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Modelos sincronizados');
    } else {
      await sequelize.sync(); // solo crea tablas que no existen
    }
  } catch (error) {
    logger.error('❌ Error conectando a PostgreSQL:', error);
    throw error;
  }
}

module.exports = { sequelize, connectDB };