"use client"

import { useState } from "react"

import { ArticleList } from "@/components/dashboard/article/article-list"
import { ArticleReader } from "@/components/dashboard/article/article-reader"
import { FeedSidebar } from "@/components/dashboard/layout/feed-sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardPage() {
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<
    "all" | "unread" | "starred" | "readLater"
  >("all")
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
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
        <header className="bg-background/60 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
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
          <aside className="w-full max-w-3xl flex-shrink-0 overflow-hidden">
            <ArticleReader articleId={selectedArticleId} />
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
