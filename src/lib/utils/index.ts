export { cn } from "./style"

/**
 * Detects if the application is running in a production HTTPS environment
 *
 * Uses the request host header to determine if cookies should use the secure flag.
 * Returns true for HTTPS production environments, false for HTTP development/localhost.
 *
 * @param host - The host header from the request (e.g., "localhost:3000" or "example.com")
 * @returns true if running in production (HTTPS), false for development (HTTP)
 */
export function isProduction(host?: string | null): boolean {
  if (!host) return false
  return !host.includes("localhost")
}
