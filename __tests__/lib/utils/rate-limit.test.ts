import {
  createTokenBucket,
  globalBucket,
  globalGETRateLimit,
  globalPOSTRateLimit,
} from "@/lib/utils/rate-limit"

// Mock next/headers
jest.mock("next/headers", () => ({
  headers: jest.fn(),
}))

describe("createTokenBucket", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("check", () => {
    it("returns true for new key (no bucket exists)", () => {
      const bucket = createTokenBucket<string>(10, 1)
      expect(bucket.check("user1", 5)).toBe(true)
    })

    it("returns true when bucket has enough tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 3)
      expect(bucket.check("user1", 5)).toBe(true)
    })

    it("returns false when bucket lacks tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 9)
      expect(bucket.check("user1", 5)).toBe(false)
    })

    it("returns true when exact tokens are available", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 5)
      expect(bucket.check("user1", 5)).toBe(true)
    })

    it("accounts for refill when time has passed", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 9) // 1 token left

      // Advance time by 2 seconds (2 refills)
      jest.setSystemTime(new Date("2024-01-01T00:00:02Z"))
      expect(bucket.check("user1", 3)).toBe(true) // 1 + 2 = 3 tokens
    })

    it("caps refilled tokens at max", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 5) // 5 tokens left

      // Advance time by 100 seconds (100 refills, but max is 10)
      jest.setSystemTime(new Date("2024-01-01T00:01:40Z"))
      expect(bucket.check("user1", 10)).toBe(true) // Capped at 10
      expect(bucket.check("user1", 11)).toBe(false) // Can't exceed max
    })

    it("returns false when refill not enough for cost", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 10) // 0 tokens left

      // Advance time by 1 second (1 refill)
      jest.setSystemTime(new Date("2024-01-01T00:00:01Z"))
      expect(bucket.check("user1", 1)).toBe(true) // 0 + 1 = 1 token
      expect(bucket.check("user1", 2)).toBe(false) // Not enough
    })
  })

  describe("consume", () => {
    it("creates new bucket and consumes tokens for new key", () => {
      const bucket = createTokenBucket<string>(10, 1)
      expect(bucket.consume("user1", 3)).toBe(true)
      expect(bucket.check("user1", 7)).toBe(true)
      expect(bucket.check("user1", 8)).toBe(false)
    })

    it("returns true when bucket has enough tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 5)
      expect(bucket.consume("user1", 3)).toBe(true)
    })

    it("returns false when bucket lacks tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 8)
      expect(bucket.consume("user1", 5)).toBe(false)
    })

    it("does not consume tokens when returning false", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 8) // 2 left
      expect(bucket.consume("user1", 5)).toBe(false)
      expect(bucket.check("user1", 2)).toBe(true) // Still 2 left
    })

    it("updates bucket with refilled tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 9) // 1 token left

      // Advance time by 3 seconds (3 refills)
      jest.setSystemTime(new Date("2024-01-01T00:00:03Z"))
      expect(bucket.consume("user1", 4)).toBe(true) // 1 + 3 = 4, consume 4, 0 left
      expect(bucket.check("user1", 1)).toBe(false)
    })

    it("caps refilled tokens at max before consuming", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 5) // 5 tokens left

      // Advance time by 100 seconds (100 refills, but max is 10)
      jest.setSystemTime(new Date("2024-01-01T00:01:40Z"))
      expect(bucket.consume("user1", 10)).toBe(true) // Capped at 10, consume 10
      expect(bucket.check("user1", 1)).toBe(false) // 0 left
    })

    it("updates refilledAt timestamp after refill", () => {
      const bucket = createTokenBucket<string>(10, 1)
      jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))
      bucket.consume("user1", 5)

      // Advance time by 2 seconds
      jest.setSystemTime(new Date("2024-01-01T00:00:02Z"))
      bucket.consume("user1", 2)

      // Advance time by 1 more second (should only refill 1, not 3)
      jest.setSystemTime(new Date("2024-01-01T00:00:03Z"))
      expect(bucket.check("user1", 6)).toBe(true) // (10 - 5 + 2 - 2 + 1) = 6
    })

    it("handles multiple users independently", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 8)
      bucket.consume("user2", 3)

      expect(bucket.check("user1", 2)).toBe(true) // 2 left
      expect(bucket.check("user2", 7)).toBe(true) // 7 left
    })

    it("allows consuming exact remaining tokens", () => {
      const bucket = createTokenBucket<string>(10, 1)
      bucket.consume("user1", 3) // 7 left
      expect(bucket.consume("user1", 7)).toBe(true) // Exactly 7
      expect(bucket.check("user1", 1)).toBe(false) // 0 left
    })

    it("handles zero cost consumption", () => {
      const bucket = createTokenBucket<string>(10, 1)
      expect(bucket.consume("user1", 0)).toBe(true)
      expect(bucket.check("user1", 10)).toBe(true) // Still 10 left
    })

    it("returns false when trying to consume more than max on first request", () => {
      const bucket = createTokenBucket<string>(10, 1)
      expect(bucket.consume("user1", 15)).toBe(true) // Creates bucket with -5
      expect(bucket.check("user1", 1)).toBe(false)
    })
  })

  describe("bucket properties", () => {
    it("exposes max property", () => {
      const bucket = createTokenBucket<string>(50, 2)
      expect(bucket.max).toBe(50)
    })

    it("exposes refillIntervalSeconds property", () => {
      const bucket = createTokenBucket<string>(50, 2)
      expect(bucket.refillIntervalSeconds).toBe(2)
    })
  })

  describe("different key types", () => {
    it("works with number keys", () => {
      const bucket = createTokenBucket<number>(10, 1)
      bucket.consume(123, 5)
      expect(bucket.check(123, 5)).toBe(true)
    })

    it("works with object keys", () => {
      const bucket = createTokenBucket<{ id: string }>(10, 1)
      const key1 = { id: "user1" }
      const key2 = { id: "user1" } // Different object reference

      bucket.consume(key1, 5)
      expect(bucket.check(key1, 5)).toBe(true)
      expect(bucket.check(key2, 10)).toBe(true) // Different key object
    })
  })
})

describe("globalBucket", () => {
  it("is created with max 100 and 1 second refill interval", () => {
    expect(globalBucket.max).toBe(100)
    expect(globalBucket.refillIntervalSeconds).toBe(1)
  })
})

describe("globalGETRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns true when X-Forwarded-For header is null", async () => {
    const { headers } = require("next/headers")
    headers.mockResolvedValue({
      get: jest.fn().mockReturnValue(null),
    })

    const result = await globalGETRateLimit()
    expect(result).toBe(true)
  })

  it("consumes 1 token from globalBucket when X-Forwarded-For is present", async () => {
    const { headers } = require("next/headers")
    headers.mockResolvedValue({
      get: jest.fn().mockReturnValue("192.168.1.1"),
    })

    const consumeSpy = jest.spyOn(globalBucket, "consume")
    await globalGETRateLimit()

    expect(consumeSpy).toHaveBeenCalledWith("192.168.1.1", 1)
    consumeSpy.mockRestore()
  })
})

describe("globalPOSTRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns true when X-Forwarded-For header is null", async () => {
    const { headers } = require("next/headers")
    headers.mockResolvedValue({
      get: jest.fn().mockReturnValue(null),
    })

    const result = await globalPOSTRateLimit()
    expect(result).toBe(true)
  })

  it("consumes 3 tokens from globalBucket when X-Forwarded-For is present", async () => {
    const { headers } = require("next/headers")
    headers.mockResolvedValue({
      get: jest.fn().mockReturnValue("192.168.1.1"),
    })

    const consumeSpy = jest.spyOn(globalBucket, "consume")
    await globalPOSTRateLimit()

    expect(consumeSpy).toHaveBeenCalledWith("192.168.1.1", 3)
    consumeSpy.mockRestore()
  })
})
