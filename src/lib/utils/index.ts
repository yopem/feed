export { cn } from "./style"

export function isProduction(host?: string | null): boolean {
  if (!host) return false
  return !host.includes("localhost")
}
