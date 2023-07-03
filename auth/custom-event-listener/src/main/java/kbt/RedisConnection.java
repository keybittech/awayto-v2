package kbt;

import org.jboss.logging.Logger;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.DefaultJedisClientConfig;

public class RedisConnection {
  private static final Logger log = Logger.getLogger(CustomEventListenerProvider.class);

  public Jedis connect() {
    DefaultJedisClientConfig clientConfig = DefaultJedisClientConfig
      .builder()
      .password(System.getenv("KC_REDIS_PASS"))
      .build();
    return new Jedis(System.getenv("KC_REDIS_HOST"), Integer.valueOf(System.getenv("KC_REDIS_PORT")), clientConfig);
  }

  public boolean rateLimit(String target, String action, int maxAttempts, int timeWindowSeconds) {
    String rateLimitKey = action + ":rate_limit:" + target;

    try (Jedis jedis = connect()) {
      // Increment the count of attempts
      long currentCount = jedis.incr(rateLimitKey);

      // Set the expiration time for the rate limit key if this is the first attempt
      if (currentCount == 1) {
        jedis.expire(rateLimitKey, timeWindowSeconds);
      }

      // Check if the rate limit has been exceeded
      return currentCount > maxAttempts;
    } catch (Exception e) {
      log.warn("Failed Redis interaction during rate limiting");
      e.printStackTrace();
      return false;
    }
  }
}
