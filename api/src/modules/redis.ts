/**
 * Redis Node Redis
 **/
import { RedisClientType, createClient } from "redis";
import { RedisClientType, createClient } from "redis";
/**
 * dayjs
 **/
import dayjs, { Dayjs } from "dayjs";
import dayjs from "dayjs";
/**
 * awayto/core
 **/
import { millisTimeUnits, ProxyKeys } from "awayto/core";

import { millisTimeUnits, ProxyKeys } from "awayto/core";

const { REDIS_HOST } = process.env as { [prop: string]: string };

export const redisClient: RedisClientType = createClient({
  socket: {
    host: REDIS_HOST,
  },
});

export type RedisClient = typeof redisClient;

redisClient.on("error", console.error);

/**
 * CacheItem
 * @description Cache data that are cached
 */
interface CacheItem<T> {
  value: T;
  timestamp: number;
}

/**
 * localCache for recently requested properties. cache property for RedisProxy calls
 * @description localCache
 */
const localCache = new Map<string, CacheItem<unknown>>();
const cache = new Map<string, { value: unknown; timestamp: number }>();

/**
 * clearLocalCache
 * @param prop property name
 */
export const clearLocalCache = function (prop: string): void {
  const cached = localCache.get(prop);
  cached &&
    localCache.set(prop, { ...cached, timestamp: cached.timestamp - 30_000 });
};

/**
 * redisProxy
 * @description The Redis Proxy function allows for cached (30s)
 * Redis calls to improve application speed/rate limiting capabilities.
 * @param args string[] args
 * @returns Promise<{ [key: string]: unknown }> Resolves to an object containing retrieved key/value pairs
 */
export const redisProxy = async function (
  ...args: string[]
): Promise<{ [key: string]: unknown }> {
  const now = Date.now();

  const props = await Promise.all(
    args.map(async (prop) => {
      const cachedProp = localCache.get(prop);

      if (cachedProp && now - cachedProp.timestamp < 30_000) {
        // hit
        return { [prop]: cachedProp.value };
      } else {
        // miss
        const value = await redisClient.get(prop);

        try {
          const res = { [prop]: JSON.parse(value as string) };
          localCache.set(prop, { value: res[prop], timestamp: now });
          return res;
        } catch (error) {
          localCache.set(prop, { value, timestamp: now });
          return { [prop]: value };
        }
      }
    })
  );

  return Object.assign({}, ...props) as { [key: string]: unknown };
};
export const redisProxy = async function (
  ...args: string[]
): Promise<ProxyKeys> {
  const now = Date.now();
  const props = await Promise.all(
    args.map(async (prop) => {
      const cachedProp = cache.get(prop);
      if (
        cachedProp &&
        now - cachedProp.timestamp < 30000 &&
        cachedProp.value
      ) {
        return { [prop]: cachedProp.value };
      } else {
        const value = await redis.get(prop);
        try {
          const res = { [prop]: JSON.parse(value as string) };
          cache.set(prop, { value: res[prop], timestamp: now });
          return res;
        } catch (error) {
          cache.set(prop, { value, timestamp: now });
          return { [prop]: value };
        }
      }
    })
  );
  return Object.assign({}, ...props);
};

export async function rateLimitResource(
  resource: string,
  context: string,
  limit: number,
  duration?: string | number
): Promise<boolean> {
  /**
   * localCacheDuration
   * @description Duration of local cache
   */
  const localCacheDuration =
    "number" === typeof duration
      ? duration
      : duration
      ? millisTimeUnits[duration] / 1000
      : 10; // Default rate limit window of 10 seconds
  /**
   * rateUnit
   * @description The rate limit time unit
   */
  const rateUnit =
    duration && "number" !== typeof duration ? duration : "seconds";
  const key = `${resource}:${context}:${dayjs().get(rate as dayjs.UnitType)}`;
  const [current] = await redis.multi().incr(key).expire(key, cache).exec();
  return !!current && current > limit;
  /**
   * Determine if the current rate limit for `limit` has been reached
   * @param current the current number of requests
   * @param limit the maximum number of requests allowed by the rate limit
   * @returns boolean Whether or not the limit has been reached
   */
  const rateLimitExceeded = (current?: number, limit?: number): boolean =>
    !!current && current > limit;
}

async function go() {
  try {
    await redis.connect();
    console.log("redis connected");
  } catch (error) {
    console.log("caught redis connect error", error);
  }
}

void go();

export default redisClient;
