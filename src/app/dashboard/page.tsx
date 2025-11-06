"use client"

import { useState } from "react"

import { ArticleList } from "@/components/dashboard/article/article-list"
import { ArticleReader } from "@/components/dashboard/article/article-reader"
import { FeedSidebar } from "@/components/dashboard/layout/feed-sidebar"

export default function DashboardPage() {
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<
    "all" | "unread" | "starred" | "readLater"
  >("all")
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  )

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* Left Sidebar - Feeds */}
      <aside className="border-border w-60 flex-shrink-0 overflow-y-auto border-r">
        <FeedSidebar
          selectedFeedId={selectedFeedId}
          onFeedSelect={setSelectedFeedId}
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      </aside>

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
  )
}
