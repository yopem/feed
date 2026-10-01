export function safeRedirect(path: string | undefined, webUrl: string) {
  const fallback = new URL(webUrl).origin

  if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    return `${fallback}/`
  const target = new URL(path, fallback)

  return target.origin === fallback ? target.href : `${fallback}/`
}

export function trustedOrigin(origin: string | undefined, webUrl: string) {
  return origin === new URL(webUrl).origin
}
