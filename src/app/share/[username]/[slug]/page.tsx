"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { QRCodeDialog } from "@/components/article/qr-code-dialog"
import { SocialShareButtons } from "@/components/article/social-share-buttons"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTRPC } from "@/lib/trpc/client"
import { sanitizeHtml, stripHtml } from "@/lib/utils/html"

export default function SharedArticlePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const resolvedParams = use(params)
  const { username, slug } = resolvedParams
  const searchParams = useSearchParams()
  const isProtected = searchParams.get("protected") === "true"

  const [showPasswordDialog, setShowPasswordDialog] = useState(isProtected)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isVerified, setIsVerified] = useState(!isProtected)
  const [showQRCode, setShowQRCode] = useState(false)

  const trpc = useTRPC()

  const {
    data: article,
    isLoading,
    error,
  } = useQuery({
    ...trpc.article.byPublicSlugAndUsername.queryOptions({
      username,
      slug,
    }),
    enabled: isVerified,
  })

  const verifyPassword = useMutation(
    trpc.article.verifySharePassword.mutationOptions({
      onSuccess: (result) => {
        if (result?.success) {
          setIsVerified(true)
          setShowPasswordDialog(false)
          setPasswordError("")
        } else {
          setPasswordError("Incorrect password. Please try again.")
          setShowPasswordDialog(true)
        }
      },
      onError: (error) => {
        const errorMessage =
          error.message || "Failed to verify password. Please try again."
        setPasswordError(errorMessage)
        setShowPasswordDialog(true)
      },
    }),
  )

  const trackView = useMutation(trpc.article.trackView.mutationOptions())

  useEffect(() => {
    if (article && isVerified) {
      trackView.mutate({
        username,
        slug,
        userAgent: navigator.userAgent,
        referer: document.referrer || undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id, isVerified])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError("Please enter a password")
      return
    }
    verifyPassword.mutate({ username, slug, password })
  }

  if (!isVerified) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <AlertDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
        >
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Password Required</AlertDialogTitle>
              <AlertDialogDescription>
                This article is password protected. Please enter the password to
                view it.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError("")
                  }}
                  placeholder="Enter password"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-destructive text-sm">{passwordError}</p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogAction
                  type="submit"
                  disabled={verifyPassword.isPending}
                >
                  {verifyPassword.isPending ? "Verifying..." : "Submit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogPopup>
        </AlertDialog>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
          <LoadingSkeleton variant="text" count={8} className="h-6" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <EmptyState
          title="Article not found"
          description="This shared article doesn't exist or has expired"
        />
      </div>
    )
  }

  const isExpired =
    article.shareExpiresAt && new Date(article.shareExpiresAt) < new Date()

  if (isExpired) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <EmptyState
          title="Link expired"
          description="This shared article link has expired"
        />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-6 space-y-4 md:mb-8">
          <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            {article.feed.imageUrl && (
              <Image
                src={article.feed.imageUrl}
                alt={article.feed.title}
                width={20}
                height={20}
                className="h-5 w-5 rounded"
              />
            )}
            <span className="font-medium">{article.feed.title}</span>
            <span className="text-muted-foreground/60">•</span>
            <time dateTime={article.pubDate.toISOString()}>
              {dayjs(article.pubDate).format("MMMM D, YYYY")}
            </time>
          </div>

          <div className="flex items-center justify-between gap-4">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
              </svg>
              Open Original
            </a>
            <SocialShareButtons
              url={typeof window !== "undefined" ? window.location.href : ""}
              title={article.title}
              description={
                article.description ? stripHtml(article.description) : undefined
              }
              onQRCodeClick={() => setShowQRCode(true)}
            />
          </div>

          <Separator />
        </header>

        <QRCodeDialog
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          url={typeof window !== "undefined" ? window.location.href : ""}
          title={article.title}
        />

        {article.imageUrl && (
          <figure className="mb-6 overflow-hidden rounded-lg md:mb-8 md:rounded-xl">
            <Image
              src={article.imageUrl}
              alt={article.title}
              width={800}
              height={450}
              className="h-auto w-full object-cover"
              priority
            />
          </figure>
        )}

        {article.description && (
          <div className="mb-6 md:mb-8">
            <p className="text-foreground/90 text-lg leading-relaxed md:text-xl">
              {stripHtml(article.description)}
            </p>
          </div>
        )}

        {article.content ? (
          <div className="bg-card border-border rounded-lg border-2 p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))] md:rounded-xl md:p-6 lg:p-8">
            <div
              className="prose prose-neutral dark:prose-invert prose-sm md:prose-base lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl md:prose-h1:text-3xl prose-h2:text-xl md:prose-h2:text-2xl prose-h3:text-lg md:prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-img:rounded-lg prose-img:shadow-md prose-pre:bg-muted prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(article.content),
              }}
            />
          </div>
        ) : (
          <div className="bg-muted/30 border-border rounded-lg border-2 p-6 text-center shadow-[4px_4px_0_0_hsl(var(--foreground))] md:rounded-xl md:p-8">
            <p className="text-muted-foreground text-sm md:text-base">
              No content available. Click{" "}
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Open Original
              </a>{" "}
              to read the full article.
            </p>
          </div>
        )}

        {article.shareExpiresAt && (
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs md:text-sm">
              This link expires on{" "}
              {dayjs(article.shareExpiresAt).format("MMMM D, YYYY")}
            </p>
          </div>
        )}

        <div className="h-12 md:h-16" />
      </article>
    </div>
  )
}
