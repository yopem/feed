"use client"

import { Suspense, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"

import { ArticleList } from "@/components/article/article-list"
import { ArticleReader } from "@/components/article/article-reader"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { GlobalSearchProvider } from "@/components/shared/global-search"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import ThemeSwitcher from "@/components/theme/theme-switcher"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sheet,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTRPC } from "@/lib/trpc/client"

function DashboardContent() {
  useAutoRefresh()

  const [filter] = useQueryState("filter", parseAsString.withDefault("all"))
  const [feedSlug] = useQueryState("feed", parseAsString.withDefault(""))
  const [tagSlug] = useQueryState("tag", parseAsString)
  const [selectedArticleId, setSelectedArticleId] = useQueryState(
    "article",
    parseAsString,
  )

  const trpc = useTRPC()
  const isMobile = useIsMobile()
  const isReaderOpen = useMemo(
    () => Boolean(selectedArticleId),
    [selectedArticleId],
  )

  const { data: feeds } = useQuery(
    trpc.feed.all.queryOptions({
      page: 1,
      perPage: 100,
    }),
  )

  const { data: tags } = useQuery(trpc.tag.all.queryOptions())

  const selectedFeed = feedSlug ? feeds?.find((f) => f.slug === feedSlug) : null

  const selectedTag = tagSlug
    ? tags?.find((t) => t.id === tagSlug || t.name === tagSlug)
    : null

  const getFilterLabel = () => {
    switch (filter) {
      case "today":
        return "Today"
      case "unread":
        return "Unread"
      case "starred":
        return "Favorited"
      case "readLater":
        return "Read Later"
      case "recentlyRead":
        return "Recently Read"
      default:
        return "All Articles"
    }
  }

  const buildBreadcrumbUrl = (params: {
    tag?: string | null
    feed?: string | null
    filter?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params.tag) searchParams.set("tag", params.tag)
    if (params.feed) searchParams.set("feed", params.feed)
    if (params.filter && params.filter !== "all")
      searchParams.set("filter", params.filter)

    const query = searchParams.toString()
    return query ? `/?${query}` : "/"
  }

  return (
    <GlobalSearchProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background border-border sticky top-0 z-10 flex h-14 items-center gap-4 border-b-2 px-4">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />

                {selectedTag && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={buildBreadcrumbUrl({
                          tag: selectedTag.id,
                          filter,
                        })}
                      >
                        {selectedTag.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}

                {selectedFeed && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={buildBreadcrumbUrl({
                          tag: selectedTag?.id,
                          feed: selectedFeed.slug,
                          filter,
                        })}
                      >
                        {selectedFeed.title}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}

                <BreadcrumbItem>
                  <BreadcrumbPage>{getFilterLabel()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
          </header>

          <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
            {/* Article List - Full Width */}
            <main className="min-w-0 flex-1 overflow-y-auto">
              <ArticleList />
            </main>

            {/* Article Reader - Sheet Overlay for both Mobile and Desktop */}
            <Sheet
              open={isReaderOpen}
              onOpenChange={(open) => !open && setSelectedArticleId(null)}
            >
              <SheetPopup
                side={isMobile ? "bottom" : "right"}
                className={
                  isMobile
                    ? "bg-background max-h-[85vh] overflow-hidden rounded-t-xl border-t-2"
                    : "bg-background w-[70vw] overflow-hidden sm:max-w-none"
                }
              >
                <SheetHeader>
                  <SheetTitle className="text-sm leading-5 font-medium">
                    Reader
                  </SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ArticleReader articleId={selectedArticleId} />
                </div>
              </SheetPopup>
            </Sheet>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </GlobalSearchProvider>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="list" count={10} />}>
      <DashboardContent />
    </Suspense>
  )
}
