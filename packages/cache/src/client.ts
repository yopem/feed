import { RedisClient } from "bun"

import { env } from "env/server"

export const redis = new RedisClient(env.REDIS_URL, {
  connectionTimeout: 5000,
  idleTimeout: 0,
  autoReconnect: true,
})
