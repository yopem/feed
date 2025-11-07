import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"

let testDb: NodePgDatabase<typeof schema> | null = null
let pool: Pool | null = null

/**
 * Get or create the test database connection
 * Uses a singleton pattern to reuse the same connection across tests
 */
export function getTestDb(): NodePgDatabase<typeof schema> {
  if (!testDb) {
    pool = new Pool({
      connectionString: process.env["DATABASE_URL"],
    })

    testDb = drizzle(pool, { schema })
  }

  return testDb
}

/**
 * Run database migrations for the test database
 * Should be called once before all tests
 */
export async function migrateTestDb() {
  const db = getTestDb()
  await migrate(db, { migrationsFolder: "./src/lib/db/migrations" })
}

/**
 * Clean up database connection
 * Should be called after all tests
 */
export async function closeTestDb() {
  if (pool) {
    await pool.end()
    testDb = null
    pool = null
  }
}

/**
 * Transaction wrapper for test isolation
 * Each test runs in a transaction that is rolled back after the test
 *
 * @example
 * test('creates a feed', async () => {
 *   await withTestTransaction(async (tx) => {
 *     const feed = await tx.insert(feedTable).values({ ... }).returning()
 *     expect(feed).toBeDefined()
 *   })
 * })
 */
export async function withTestTransaction<T>(
  fn: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  const db = getTestDb()
  let result: T | undefined

  try {
    await db.transaction(async (tx) => {
      result = await fn(tx)
      throw new Error("ROLLBACK")
    })
  } catch (error) {
    if ((error as Error).message === "ROLLBACK") {
      return result as T
    }
    throw error
  }

  return result as T
}

/**
 * Clear all data from all tables
 * Use with caution - only for test cleanup
 */
export async function clearTestDb() {
  const db = getTestDb()

  await db.delete(schema.feedTagsTable)
  await db.delete(schema.articleTable)
  await db.delete(schema.feedTable)
  await db.delete(schema.tagTable)
}
