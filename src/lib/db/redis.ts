import type { Redis } from "ioredis"

import { redisUrl } from "@/lib/env/server"

export function createRedisCache() {
  let redis: Redis | null = null

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
      await client.setex(key, ttlSeconds, serialized)
    } catch (error) {
      console.error("Failed to set cache:", error)
    }
  }

  async function getCache<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()
    if (!client) return null

    try {
      const value = await client.get(key)
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

  async function deleteCache(key: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      await client.del(key)
    } catch (error) {
      console.error("Failed to delete cache:", error)
    }
  }

  async function invalidatePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const keys = await client.keys(pattern)
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
