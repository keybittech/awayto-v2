import { createClient } from "redis";

export const redis = createClient();

export type RedisClient = typeof redis;

redis.on('error', console.error)

export const redisProxy = new Proxy({} as { [prop: string]: string }, {
  async get(target, propKey: string) {
    target[propKey] = await redis.get(propKey) || '';
    return Reflect.get(target, propKey);
  }
});

async function go() {
  try {
    await redis.connect();
  } catch (error) {
    console.log('caught redis connect error', error);
  }
}

void go();

export default redis;