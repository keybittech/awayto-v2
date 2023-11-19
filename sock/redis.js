import dotenv from 'dotenv';
dotenv.config();
import { createClient } from 'redis';
import { v4 } from 'uuid';
import { stale } from './events/index.js';

const redis = createClient({
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
  }
});

redis.on('error', err => {
  console.log('Redis connection error:', err.message);
});

redis.on('ready', () => {
  console.log('Redis client ready.');
});

export const serverUuid = v4();
export const socketId = process.env.SERVER_ID || 'websocket.0';

await redis.connect();

// When the server starts up, add its id to redis
await redis.sAdd('socket_servers', serverUuid);

// Every 5 seconds, heartbeat id to redis
setInterval(async function() {
  if (!redis.isReady) return;
  await redis.incr(`socket_servers:${serverUuid}:heartbeat`);
  await redis.expire(`socket_servers:${serverUuid}:heartbeat`, 10);
}, 5000);

// If this is the first socket server running
if ('websocket.0' === socketId) {
  setInterval(async function() {
    if (!redis.isReady) return;
    // Check all socket servers
    const servers = await redis.sMembers('socket_servers');
    for (const servUuid of servers) {

      // If no heartbeat, remove stale connections
      const hbCount = await redis.get(`socket_servers:${servUuid}:heartbeat`);
      if (!hbCount) {
        const staleConnections = await redis.sMembers(`socket_servers:${servUuid}:connections`);
        if (staleConnections.length) {
          await handleUnsubRedis(staleConnections);
        }
        await redis.sRem('socket_servers', servUuid);
      }
    }
  }, 15 * 1000);
}

export async function handleUnsubRedis(connectionStrings) {
  if (!redis.isReady) return;
  const deadTopics = [];
  for (const connectionString of connectionStrings) {
    const connectionId = connectionString.split(':')[1];
    await redis.sRem(`socket_servers:${serverUuid}:connections`, connectionString); // remove from socket server connection cache
    const topics = await redis.sMembers(`connection_id:${connectionId}:topics`); 
    for (const topic of topics) {
      await redis.sRem(topic, connectionId); // remove connection from each topic
      deadTopics.push(topic);
    }
    await redis.del(`connection_id:${connectionId}:topics`); // remove connection's topics
  }
  try {
    await stale(connectionStrings);
  } catch (error) {
    console.log('error with stale', error);
  }
  return deadTopics;
}

export default redis;