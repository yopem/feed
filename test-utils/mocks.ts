import RedisMock from "ioredis-mock"

/**
 * Create a mock Redis client for testing
 * Uses ioredis-mock which implements the ioredis interface
 *
 * @example
 * const redis = createMockRedis()
 * await redis.set('key', 'value')
 * const value = await redis.get('key')
 */
export function createMockRedis() {
  return new RedisMock()
}

/**
 * Mock session data for authenticated users
 *
 * @example
 * const session = createMockSession({ userId: 'user_123' })
 */
export function createMockSession(overrides?: {
  userId?: string
  email?: string
  name?: string
}) {
  return {
    user: {
      id: overrides?.userId ?? "test-user-id",
      email: overrides?.email ?? "test@example.com",
      name: overrides?.name ?? "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Mock fetch function for testing external API calls
 *
 * @example
 * global.fetch = createMockFetch({
 *   'https://example.com/feed.xml': new Response(sampleRSSFeed)
 * })
 */
export function createMockFetch(
  responses: Record<
    string,
    Response | ((url: string, init?: RequestInit) => Response)
  >,
): typeof fetch {
  return jest.fn((url: string | URL | Request, init?: RequestInit) => {
    const urlString =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.toString()
          : url.url
    const response = responses[urlString]

    if (!response) {
      return Promise.resolve(
        new Response(null, {
          status: 404,
          statusText: "Not Found",
        }),
      )
    }

    if (typeof response === "function") {
      return Promise.resolve(response(urlString, init))
    }

    return Promise.resolve(response)
  }) as any
}

/**
 * Mock setTimeout for testing rate limiting and delays
 * Automatically advances timers
 *
 * @example
 * jest.useFakeTimers()
 * const promise = someAsyncFunction()
 * jest.advanceTimersByTime(5000)
 * await promise
 */
export function setupMockTimers() {
  jest.useFakeTimers()
}

export function cleanupMockTimers() {
  jest.useRealTimers()
}

/**
 * Mock environment variables for testing
 *
 * @example
 * mockEnv({ DATABASE_URL: 'postgresql://test:test@localhost/test' })
 */
export function mockEnv(vars: Record<string, string>) {
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value
  })
}

/**
 * Restore environment variables after testing
 */
export function restoreEnv(originalEnv: NodeJS.ProcessEnv) {
  process.env = originalEnv
}
