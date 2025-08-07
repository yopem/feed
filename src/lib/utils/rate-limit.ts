import { headers } from "next/headers"

export interface Bucket {
  count: number
  refilledAt: number
}

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

export const globalBucket = createTokenBucket<string>(100, 1)

export async function globalGETRateLimit(): Promise<boolean> {
  // Note: Assumes X-Forwarded-For will always be defined.
  const headersData = await headers()
  const clientIP = headersData.get("X-Forwarded-For")

  if (clientIP === null) {
    return true
  }

  return globalBucket.consume(clientIP, 1)
}

export async function globalPOSTRateLimit(): Promise<boolean> {
  // Note: Assumes X-Forwarded-For will always be defined.
  const headersData = await headers()
  const clientIP = headersData.get("X-Forwarded-For")

  if (clientIP === null) {
    return true
  }

  return globalBucket.consume(clientIP, 3)
}
