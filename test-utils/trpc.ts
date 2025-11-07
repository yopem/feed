import { initTRPC } from "@trpc/server"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import superjson from "superjson"
import z, { ZodError } from "zod"

import * as schema from "@/lib/db/schema"
import { getTestDb } from "./db"
import { createMockRedis } from "./mocks"

type SessionProperties = {
  id: string
  email: string
  name: string | null
  username: string
  image: string | null
  role: "user" | "member" | "admin"
}

type TestContext = {
  db: NodePgDatabase<typeof schema>
  redis: ReturnType<typeof createMockRedis>
  session: SessionProperties | false
  headers: Headers
}

/**
 * Create a test tRPC context for use in tests
 * Provides mock database, Redis, and session objects
 *
 * @example
 * // Create authenticated context
 * const ctx = await createTestContext({ authenticated: true })
 *
 * // Create unauthenticated context
 * const ctx = await createTestContext({ authenticated: false })
 *
 * // Create context with specific user
 * const ctx = await createTestContext({
 *   authenticated: true,
 *   userId: 'user_123'
 * })
 */
export async function createTestContext(options?: {
  authenticated?: boolean
  userId?: string
  email?: string
  username?: string
  role?: "user" | "member" | "admin"
  headers?: Headers
}): Promise<TestContext> {
  const db = getTestDb()
  const redis = createMockRedis()

  let session: SessionProperties | false = false

  if (options?.authenticated) {
    session = {
      id: options.userId ?? "test-user-id",
      email: options.email ?? "test@example.com",
      name: "Test User",
      username: options.username ?? "testuser",
      image: null,
      role: options.role ?? "user",
    }
  }

  return {
    db,
    redis,
    session,
    headers: options?.headers ?? new Headers(),
  }
}

/**
 * Create a test tRPC instance that doesn't require server-only modules
 * Use this for testing tRPC routers without importing from @/lib/api/root
 */
const t = initTRPC.context<TestContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
})

export const createTestCallerFactory = t.createCallerFactory
export const createTestRouter = t.router

// Create test procedures for mocking
const timingMiddleware = t.middleware(async ({ next }) => {
  return await next()
})

export const createTestPublicProcedure = () => t.procedure.use(timingMiddleware)

export const createTestProtectedProcedure = () =>
  t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
    if (!ctx.session || typeof ctx.session !== "object") {
      throw new Error("UNAUTHORIZED")
    }

    return next({
      ctx: {
        session: { ...ctx.session },
      },
    })
  })

/**
 * Create a test caller for a router record
 * This bypasses server-only module imports
 *
 * @example
 * import { feedRouter } from '@/lib/api/routers/feed'
 * const ctx = await createTestContext({ authenticated: true })
 * const caller = createTestCaller(feedRouter, ctx)
 * await caller.create('https://example.com/feed.xml')
 */
export function createTestCaller<TRouterRecord>(
  routerRecord: TRouterRecord,
  ctx: TestContext,
) {
  // Wrap the router record in a router
  const router = createTestRouter(routerRecord as any)
  return createTestCallerFactory(router)(ctx)
}

/**
 * Helper to test protected procedures
 * Verifies that a procedure throws UNAUTHORIZED when called without authentication
 *
 * @example
 * await expectUnauthorized(async () => {
 *   const ctx = await createTestContext({ authenticated: false })
 *   const caller = createCallerFactory(appRouter)(ctx)
 *   await caller.feed.create({ title: 'Test', url: 'https://example.com' })
 * })
 */
export async function expectUnauthorized(fn: () => Promise<any>) {
  await expect(fn()).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  })
}

/**
 * Helper to test procedures that should throw NOT_FOUND
 *
 * @example
 * await expectNotFound(async () => {
 *   const ctx = await createTestContext({ authenticated: true })
 *   const caller = createCallerFactory(appRouter)(ctx)
 *   await caller.feed.getById({ id: 'nonexistent-id' })
 * })
 */
export async function expectNotFound(fn: () => Promise<any>) {
  await expect(fn()).rejects.toMatchObject({
    code: "NOT_FOUND",
  })
}

/**
 * Helper to test procedures that should throw BAD_REQUEST
 *
 * @example
 * await expectBadRequest(async () => {
 *   const ctx = await createTestContext({ authenticated: true })
 *   const caller = createCallerFactory(appRouter)(ctx)
 *   await caller.feed.create({ title: '', url: 'invalid-url' })
 * })
 */
export async function expectBadRequest(fn: () => Promise<any>) {
  await expect(fn()).rejects.toMatchObject({
    code: "BAD_REQUEST",
  })
}
