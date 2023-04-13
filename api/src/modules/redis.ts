export async function rateLimitResource(
  resource: string,
  context: string,
  limit: number,
  duration?: string | number
): Promise<boolean> {
  // Default rate limit window of 10 seconds

  const key = `${resource}:${context}:${dayjs().get(rate as dayjs.UnitType)}`;
  const [current] = await redis.multi().incr(key).expire(key, cache).exec();
  export default {};
}

async function go() {
  try {
    await redis.connect();
    console.log("redis connected");
  } catch (error) {
    console.log("caught redis connect error", error);
  }
}
