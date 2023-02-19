import { createClient } from "redis";

export const redis = createClient();

export type RedisClient = typeof redis;

redis.on('error', console.error)

async function go(){

  try {
    await redis.connect();
    await redis.set('test', 'test');
    const result = await redis.get('test');

    console.log({ SUCCESS: result })
  } catch (error) {
    console.log('caught redis error', error);
  }

}

void go();

export default redis;