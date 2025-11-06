/**
 * Strips HTML tags from a string and returns plain text
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ""

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, "")

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim()

  return text
}

/**
 * Sanitizes HTML content for safe rendering
 * Allows only safe tags and removes potentially dangerous content
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ""

  // Remove script and style tags completely
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")

  // Remove javascript: protocol from links
  sanitized = sanitized.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"',
  )

  // Remove data: protocol from images (potential XSS vector)
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""')

  return sanitized
}

/**
 * Truncates HTML content to a specific length while preserving complete words
 * @param html - HTML string to truncate
 * @param maxLength - Maximum length in characters
 * @returns Truncated plain text with ellipsis if needed
 */
export function truncateHtml(
  html: string | null | undefined,
  maxLength: number,
): string {
  const text = stripHtml(html)

  if (text.length <= maxLength) return text

  // Find the last space before maxLength to avoid cutting words
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + "..."
  }

  return truncated + "..."
}
