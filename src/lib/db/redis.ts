import type { Redis } from "ioredis"

import { redisKeyPrefix, redisUrl } from "@/lib/env/server"

/**
 * Creates a Redis cache utility with automatic key prefixing support
 *
 * All cache operations automatically prepend the configured REDIS_KEY_PREFIX
 * to keys, providing namespace isolation in shared Redis instances.
 * When REDIS_KEY_PREFIX is empty (default), keys remain unchanged for
 * backward compatibility.
 *
 * @returns Cache utility with setCache, getCache, deleteCache, and invalidatePattern methods
 */
export function createRedisCache() {
  let redis: Redis | null = null
  const prefix = redisKeyPrefix

  async function initRedis(): Promise<Redis | null> {
    if (redis) return redis

    if (!redisUrl) {
      console.warn("Redis URL not found. Caching will be disabled.")
      return null
    }

    try {
      const { default: RedisClient } = await import("ioredis")
      redis = new RedisClient(redisUrl)

      redis.on("error", (err: Error) => {
        console.error("Redis connection error:", err)
      })

      redis.on("connect", () => {
        console.info("Redis connected successfully")
      })

      return redis
    } catch (error) {
      console.error("Failed to create Redis client:", error)
      return null
    }
  }

  function markDatesForSerialization(obj: unknown): unknown {
    if (obj instanceof Date) {
      return { __type: "Date", value: obj.toISOString() }
    }

    if (Array.isArray(obj)) {
      return obj.map(markDatesForSerialization)
    }

    if (obj && typeof obj === "object" && obj.constructor === Object) {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = markDatesForSerialization(value)
      }
      return result
    }

    return obj
  }

  /**
   * Stores a value in Redis cache with automatic key prefixing
   *
   * @param key - Cache key (prefix will be automatically applied)
   * @param value - Value to cache (supports Date objects via serialization)
   * @param ttlSeconds - Time to live in seconds (default: 3601)
   */
  async function setCache<T>(
    key: string,
    value: T,
    ttlSeconds = 3601,
  ): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const processedValue = markDatesForSerialization(value)
      const serialized = JSON.stringify(processedValue)
      const prefixedKey = `${prefix}${key}`
      await client.setex(prefixedKey, ttlSeconds, serialized)
    } catch (error) {
      console.error("Failed to set cache:", error)
    }
  }

  /**
   * Retrieves a value from Redis cache with automatic key prefixing
   *
   * @param key - Cache key (prefix will be automatically applied)
   * @returns Cached value or null if not found
   */
  async function getCache<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()
    if (!client) return null

    try {
      const prefixedKey = `${prefix}${key}`
      const value = await client.get(prefixedKey)
      if (!value) return null

      return JSON.parse(value, (_key, val) => {
        if (val && typeof val === "object" && val.__type === "Date") {
          return new Date(val.value)
        }
        return val
      })
    } catch (error) {
      console.error("Failed to get cache:", error)
      return null
    }
  }

  /**
   * Deletes a cache entry with automatic key prefixing
   *
   * @param key - Cache key to delete (prefix will be automatically applied)
   */
  async function deleteCache(key: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const prefixedKey = `${prefix}${key}`
      await client.del(prefixedKey)
    } catch (error) {
      console.error("Failed to delete cache:", error)
    }
  }

  /**
   * Invalidates all cache entries matching a pattern with automatic key prefixing
   *
   * @param pattern - Redis key pattern (e.g., "feed:*:user:123", prefix will be automatically applied)
   */
  async function invalidatePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const prefixedPattern = `${prefix}${pattern}`
      const keys = await client.keys(prefixedPattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (error) {
      console.error("Failed to invalidate cache pattern:", error)
    }
  }

  async function getRedisClient(): Promise<Redis | null> {
    if (typeof process === "undefined") {
      return null
    }
    redis ??= await initRedis()
    return redis
  }

  return {
    setCache,
    getCache,
    deleteCache,
    invalidatePattern,
  }
}
