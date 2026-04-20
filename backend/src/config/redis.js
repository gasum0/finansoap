const { createClient } = require('redis');
const logger = require('./logger');
let redisClient;

async function connectRedis() {
  // Railway da REDIS_URL, localmente usa host/port
  const url = process.env.REDIS_URL;
  redisClient = url
    ? createClient({ url })
    : createClient({ socket: { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 } });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  await redisClient.connect();
  logger.info('✅ Redis conectado');
}

function getRedis() {
  if (!redisClient) throw new Error('Redis no inicializado');
  return redisClient;
}

module.exports = { connectRedis, getRedis };