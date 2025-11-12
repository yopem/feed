import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createCaller } from "@/lib/api/root"
import { createTRPCContext } from "@/lib/api/trpc"

export default async function UsernameShortUrlRedirectPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params

  try {
    const heads = new Headers(await headers())
    const ctx = await createTRPCContext({ headers: heads })
    const caller = createCaller(ctx)

    const article = await caller.article.byPublicSlugAndUsername({
      username,
      slug,
    })

    if (article?.isPasswordProtected) {
      redirect(`/share/${username}/${slug}?protected=true`)
    } else {
      redirect(`/share/${username}/${slug}`)
    }
  } catch (error) {
    // Re-throw redirect errors to allow Next.js to handle them
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }
    console.error("[Share URL Redirect] Error:", error)
    redirect("/")
  }
}
