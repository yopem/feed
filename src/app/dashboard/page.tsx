"use client"

import { useMemo, useState } from "react"

import { ArticleList } from "@/components/dashboard/article/article-list"
import { ArticleReader } from "@/components/dashboard/article/article-reader"
import { FeedSidebar } from "@/components/dashboard/layout/feed-sidebar"
import ThemeSwitcher from "@/components/theme/theme-switcher"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardPage() {
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<
    "all" | "unread" | "starred" | "readLater"
  >("all")
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  )

  const isMobile = useIsMobile()
  const isReaderOpen = useMemo(
    () => Boolean(selectedArticleId),
    [selectedArticleId],
  )

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarContent>
          <FeedSidebar
            selectedFeedId={selectedFeedId}
            onFeedSelect={setSelectedFeedId}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="glass sticky top-0 z-10 flex h-14 items-center gap-2 px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </header>

        <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
          {/* Middle Panel - Article List */}
          <main className="border-border min-w-0 flex-1 overflow-y-auto border-r">
            <ArticleList
              selectedFeedId={selectedFeedId}
              activeFilter={filter}
              selectedArticleId={selectedArticleId}
              onArticleSelect={setSelectedArticleId}
            />
          </main>

          {/* Right Panel - Article Reader */}
          {!isMobile ? (
            <aside className="w-full max-w-3xl flex-shrink-0 overflow-hidden">
              <ArticleReader articleId={selectedArticleId} />
            </aside>
          ) : (
            <Sheet
              open={isReaderOpen}
              onOpenChange={(open) => !open && setSelectedArticleId(null)}
            >
              <SheetContent
                side="bottom"
                className="glass max-h-[85vh] overflow-hidden rounded-t-xl border-t"
              >
                <SheetHeader className="panel-header">
                  <SheetTitle className="text-sm leading-5 font-medium">
                    Reader
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <ArticleReader articleId={selectedArticleId} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
