import { RedisClientType, createClient } from 'redis';
import { ProxyKeys } from 'awayto/core';

export const DEFAULT_THROTTLE = 10;

const {
  REDIS_PASS,
  REDIS_HOST
} = process.env as { [prop: string]: string };

export const redis = createClient({
  password: REDIS_PASS,
  socket: {
    host: REDIS_HOST
  }
}) as RedisClientType;

export type RedisClient = typeof redis;

redis.on('error', console.error);



const cache = new Map<string, { value: unknown, timestamp: number }>();

export const clearLocalCache = function(prop: string): void {
  const cached = cache.get(prop);
  cached && cache.set(prop, { ...cached, timestamp: cached.timestamp - 30000 });
}

export const redisProxy = async function(...args: string[]): Promise<ProxyKeys> {
  const now = Date.now();
  const props = await Promise.all(args.map(async prop => {
    const cachedProp = cache.get(prop);
    if (cachedProp && now - cachedProp.timestamp < 30000 && cachedProp.value) {
      return { [prop]: cachedProp.value }
    } else {
      const value = await redis.get(prop);
      try {
        const res = { [prop]: JSON.parse(value as string) }
        cache.set(prop, { value: res[prop], timestamp: now })
        return res;
      } catch (error) {
        cache.set(prop, { value, timestamp: now })
        return { [prop]: value };
      }
    }
  }));
  return Object.assign({}, ...props);
}

export async function rateLimitResource(resource: string, context: string, limit: number = 10, duration: number = DEFAULT_THROTTLE): Promise<boolean> {
  
  const key = `rl:${resource}:${context}`;

  const rateLimitExceeded = await redis.incr(key);
  
  if (rateLimitExceeded === 1) {
    await redis.expire(key, duration);
  }

  if (rateLimitExceeded > limit) {
    return true;
  }

  return false;
}

export default redis;