const { createClient } = require('redis');
const logger = require('./logger');

let redisClient;

async function connectRedis() {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));

  await redisClient.connect();
  logger.info('✅ Conexión a Redis establecida');
}

function getRedis() {
  if (!redisClient) throw new Error('Redis no inicializado');
  return redisClient;
}

module.exports = { connectRedis, getRedis };
