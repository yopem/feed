"use client"

import { Suspense, useMemo } from "react"
import { parseAsString, useQueryState } from "nuqs"

import { ArticleList } from "@/components/article/article-list"
import { ArticleReader } from "@/components/article/article-reader"
import { AppSidebar } from "@/components/layout/app-sidebar"
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
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

function DashboardContent() {
  const [filter] = useQueryState("filter", parseAsString.withDefault("all"))
  const [selectedArticleId, setSelectedArticleId] = useQueryState(
    "article",
    parseAsString,
  )

  const isMobile = useIsMobile()
  const isReaderOpen = useMemo(
    () => Boolean(selectedArticleId),
    [selectedArticleId],
  )

  const getFilterLabel = () => {
    switch (filter) {
      case "unread":
        return "Unread"
      case "starred":
        return "Starred"
      case "readLater":
        return "Read Later"
      default:
        return "All Articles"
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="glass sticky top-0 z-10 flex h-14 items-center gap-4 px-4">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getFilterLabel()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
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
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className={
                isMobile
                  ? "glass max-h-[85vh] overflow-hidden rounded-t-xl border-t"
                  : "glass !w-[70vw] overflow-hidden sm:!max-w-none"
              }
            >
              <SheetHeader>
                <SheetTitle className="text-sm leading-5 font-medium">
                  Reader
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <ArticleReader articleId={selectedArticleId} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="list" count={10} />}>
      <DashboardContent />
    </Suspense>
  )
}
