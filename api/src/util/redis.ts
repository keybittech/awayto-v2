import { createClient } from "redis";

export const redis = createClient();

export type RedisClient = typeof redis;

redis.on('error', console.error)

async function go(){

  try {
    await redis.connect();
  } catch (error) {
    console.log('caught redis connect error', error);
  }

}

void go();

export default redis;