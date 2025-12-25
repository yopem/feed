export function stripHtml(html: string | null | undefined): string {
  if (!html) return ""

  let text = html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")

  text = text.replace(/<[^>]*>/g, "")

  text = text.replace(/\s+/g, " ").trim()

  return text
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ""

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")

  sanitized = sanitized.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"',
  )

  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""')

  return sanitized
}
