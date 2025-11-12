import { headers } from "next/headers"

export interface Bucket {
  count: number
  refilledAt: number
}

/**
 * Creates a token bucket rate limiter for controlling request rates
 *
 * Implements the token bucket algorithm where tokens are consumed on each request
 * and automatically refill over time. If no tokens are available, the request is denied.
 *
 * @param max - Maximum number of tokens in the bucket (capacity)
 * @param refillIntervalSeconds - Time in seconds to refill one token
 * @returns Object with check and consume methods for rate limiting
 * @example
 * const limiter = createTokenBucket(100, 1) // 100 requests per second
 * if (limiter.consume(userIP, 1)) {
 *   // Process request
 * } else {
 *   // Rate limit exceeded
 * }
 */
export function createTokenBucket<Key>(
  max: number,
  refillIntervalSeconds: number,
) {
  const storage = new Map<Key, Bucket>()

  function check(key: Key, cost: number): boolean {
    const bucket = storage.get(key) ?? null
    if (bucket === null) {
      return true
    }
    const now = Date.now()
    const refill = Math.floor(
      (now - bucket.refilledAt) / (refillIntervalSeconds * 1000),
    )
    if (refill > 0) {
      return Math.min(bucket.count + refill, max) >= cost
    }
    return bucket.count >= cost
  }

  function consume(key: Key, cost: number): boolean {
    let bucket = storage.get(key) ?? null
    const now = Date.now()
    if (bucket === null) {
      bucket = {
        count: max - cost,
        refilledAt: now,
      }
      storage.set(key, bucket)
      return true
    }
    const refill = Math.floor(
      (now - bucket.refilledAt) / (refillIntervalSeconds * 1000),
    )
    if (refill > 0) {
      bucket.count = Math.min(bucket.count + refill, max)
      bucket.refilledAt = now
    }
    if (bucket.count < cost) {
      storage.set(key, bucket)
      return false
    }
    bucket.count -= cost
    storage.set(key, bucket)
    return true
  }

  return {
    check,
    consume,
    max,
    refillIntervalSeconds,
  }
}

/**
 * Global rate limiter instance for all API requests
 *
 * Configured with 100 tokens per second capacity. Used by globalGETRateLimit
 * and globalPOSTRateLimit to enforce rate limits across the application.
 */
export const globalBucket = createTokenBucket<string>(100, 1)

/**
 * Enforces rate limiting for GET requests based on client IP
 *
 * Consumes 1 token from the global bucket per request. Uses X-Forwarded-For
 * header to identify clients. Returns true if request should be allowed.
 *
 * @returns Promise resolving to true if request is allowed, false if rate limited
 */
export async function globalGETRateLimit(): Promise<boolean> {
  // Note: Assumes X-Forwarded-For will always be defined.
  const headersData = await headers()
  const clientIP = headersData.get("X-Forwarded-For")

  if (clientIP === null) {
    return true
  }

  return globalBucket.consume(clientIP, 1)
}

/**
 * Enforces rate limiting for POST requests based on client IP
 *
 * Consumes 3 tokens from the global bucket per request (3x stricter than GET).
 * Uses X-Forwarded-For header to identify clients. Returns true if request should be allowed.
 *
 * @returns Promise resolving to true if request is allowed, false if rate limited
 */
export async function globalPOSTRateLimit(): Promise<boolean> {
  // Note: Assumes X-Forwarded-For will always be defined.
  const headersData = await headers()
  const clientIP = headersData.get("X-Forwarded-For")

  if (clientIP === null) {
    return true
  }

  return globalBucket.consume(clientIP, 3)
}
