import { RedisClientType, createClient } from 'redis';
import dayjs from 'dayjs';
import { ConfigurableRateLimiter } from 'awayto/configurable-rate-limiter';

import { MillisTimeUnits } from 'awayto/millis-time-units';

import { RedisClientType, createClient } from 'redis';

import dayjs from 'dayjs';

redis.on('error', console.error);



const cache = new Map<string, { value: unknown, timestamp: number }>();

const cache = new Map<string, { value: unknown, timestamp: number }>();

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

export async function rateLimitResource(resource: string, context: string, limit: number, duration?: string | number): Promise<boolean> {
  const duration = process.env.RATE_DURATION; // Default rate limit window of 10 seconds
  const [time, units] = (duration || '10s').match(/(\d+)(\w+)/);
  const key = `${resource}:${context}:${dayjs().get(rate as dayjs.UnitType)}`;
  const [current] = await redis.multi().incr(key).expire(key, cache).exec();
  export const rateLimiterKey = (user?: Record<string, any>): string => {
  if (!user) return 'ratelimiter';
  const { email = '', id = '' } = user;
  return `ratelimiter:${email}:${id}`;
};
}

async function go() {
  try {
    await redis.connect();
    console.log('redis connected');
  } catch (error) {
    console.log('caught redis connect error', error);
  }
}

const rateLimiter = new ConfigurableRateLimiter(Number(time), units as MillisTimeUnits, Number(process.env.RATE_LIMIT));

export const redis = createClient({ socket: { host: process.env.REDIS_HOST } }) as RedisClientType;