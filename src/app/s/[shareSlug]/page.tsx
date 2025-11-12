import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createCaller } from "@/lib/api/root"
import { createTRPCContext } from "@/lib/api/trpc"

/**
 * Short URL redirect page
 *
 * Handles /s/[shareSlug] short URLs and redirects to the full
 * /share/[username]/[slug] URL. This provides a shorter, more
 * shareable link format.
 *
 * @param params - Route params containing shareSlug
 */
export default async function ShortUrlRedirectPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>
}) {
  const { shareSlug } = await params

  try {
    const heads = new Headers(await headers())
    const ctx = await createTRPCContext({ headers: heads })
    const caller = createCaller(ctx)

    const article = await caller.article.byShareSlug({ shareSlug })

    if (!article?.username) {
      redirect("/")
    }

    if (article.isPasswordProtected) {
      redirect(`/share/${article.username}/${shareSlug}?protected=true`)
    } else {
      redirect(`/share/${article.username}/${shareSlug}`)
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }
    console.error("[Short URL Redirect] Error:", error)
    redirect("/")
  }
}
