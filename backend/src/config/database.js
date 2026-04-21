const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  pool: { max: 3, min: 0, acquire: 30000, idle: 10000 },
  logging: false,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida');
    await sequelize.sync();
    logger.info('✅ Tablas sincronizadas');
  } catch (error) {
    logger.error('❌ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
}

module.exports = { sequelize, connectDB };