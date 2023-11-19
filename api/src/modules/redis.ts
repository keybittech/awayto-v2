import { ClearLocalCache, RateLimitResourceBuilder, RedisProxyBuilder } from 'awayto/core';

export const DEFAULT_THROTTLE = 10;
const PROXY_REFRESH = 30000;

const cache = new Map<string, { value: unknown, timestamp: number }>();

export const clearLocalCache: ClearLocalCache = (prop) => {
  const cached = cache.get(prop);
  cached && cache.set(prop, { ...cached, timestamp: cached.timestamp - 30000 });
}

export const redisProxy: RedisProxyBuilder = redisClient => async (...args) => {

  const now = Date.now();
  const props = await Promise.all(args.map(async prop => {
    const cachedProp = cache.get(prop);
    if (cachedProp && now - cachedProp.timestamp < PROXY_REFRESH && cachedProp.value) {
      return { [prop]: cachedProp.value }
    } else {
      const value = await redisClient.get(prop);
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

export const rateLimitResource: RateLimitResourceBuilder = redisClient => async (resource, context, limit = 10, duration = DEFAULT_THROTTLE) => {
  const key = `rl:${resource}:${context}`;

  const rateLimitExceeded = await redisClient.incr(key);
  
  if (rateLimitExceeded === 1) {
    await redisClient.expire(key, duration);
  }

  if (rateLimitExceeded > limit) {
    return true;
  }

  return false;
}