import { customAlphabet } from "nanoid"

/**
 * Generates a unique custom ID for database records
 *
 * Creates a 64-character ID using alphanumeric characters (a-z, A-Z, 0-9).
 * Used for generating unique identifiers for feeds, articles, tags, and other entities.
 *
 * @returns A unique 64-character alphanumeric string
 * @example
 * const feedId = createCustomId() // "a7fK9m2XpQ3vN8..."
 */
export const createCustomId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  64,
)
