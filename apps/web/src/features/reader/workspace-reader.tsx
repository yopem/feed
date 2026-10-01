import { MenuIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Brand, ThemeButton } from "web/components/brand"
import { SignOutButton } from "web/components/sign-out-button"
import { ValueForm } from "web/components/value-form"
import { ArticleDetail } from "web/features/reader/article-detail"
import { ArticleResults } from "web/features/reader/article-results"
import { FeedToolbar } from "web/features/reader/feed-toolbar"
import { ReaderNavigation } from "web/features/reader/reader-navigation"
import { views } from "web/features/reader/views"
import { z } from "zod"

import type { Article, ArticleFilter, Workspace } from "rpc/reader"
import { useAddFeed, useArticles, useFeeds } from "rpc/reader"
import { Button } from "ui/button"
import { Modal } from "ui/dialog"
import { Input } from "ui/input"
import { Tabs, TabsList, TabsPanel, TabsTab } from "ui/tabs"

const feedUrl = z.url({
  protocol: /^https?$/,
  error: "Enter a valid http:// or https:// RSS feed URL.",
})

export function WorkspaceReader({
  name,
  workspace,
  workspaces,
  onSwitch,
  onCreate,
}: {
  name: string
  workspace: Workspace
  workspaces: Workspace[]
  onSwitch: (id: string) => void
  onCreate: () => void
}) {
  const [view, setView] = useState<ArticleFilter["view"]>("all")
  const [feedId, setFeedId] = useState<string>()
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [article, setArticle] = useState<Article | null>(null)
  const feeds = useFeeds(workspace.id)

  const articles = useArticles({
    workspaceId: workspace.id,
    view,
    feedId,
    search: search || undefined,
  })

  const add = useAddFeed(workspace.id)
  const activeFeed = feeds.data?.find((feed) => feed.id === feedId)
  const currentView = views.find((item) => item.value === view) ?? views[0]
  const canEdit = workspace.role !== "viewer"

  function chooseView(value: ArticleFilter["view"]) {
    setView(value)
    setFeedId(undefined)
    setMobileNav(false)
  }

  const navigation = (
    <ReaderNavigation
      workspace={workspace}
      workspaces={workspaces}
      feedId={feedId}
      onSwitch={onSwitch}
      onCreate={onCreate}
      onView={chooseView}
      onNavigate={() => setMobileNav(false)}
      onFeed={(id) => {
        setFeedId(id)
        setView("all")
        setMobileNav(false)
      }}
      onAdd={() => {
        setMobileNav(false)
        setAdding(true)
      }}
    />
  )

  return (
    <div className="reader-shell">
      <a className="skip-link" href="#reading-list">
        Skip to articles
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>
        {navigation}
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <span className="profile-name">{name}</span>
            <ThemeButton />
            <SignOutButton compact />
          </div>
        </div>
      </aside>
      <main className="reading-main" id="reading-list" tabIndex={-1}>
        <div className="panel-context">
          <Button
            variant="ghost"
            size="icon"
            className="min-[701px]:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <MenuIcon aria-hidden="true" />
          </Button>
          <span>{workspace.name}</span>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Reading</span>
          <span className="ml-auto rounded-md border px-2 py-0.5 text-xs capitalize">
            {workspace.role}
          </span>
        </div>
        <section className="reading-content" aria-labelledby="list-title">
          <header className="page-header">
            <div className="min-w-0">
              <h1 id="list-title">{activeFeed?.title ?? "Your reading"}</h1>
              <p>
                {activeFeed
                  ? "Every story from this source."
                  : "Catch up on your feeds. Keep what matters."}
              </p>
            </div>
            {canEdit ? (
              <Button variant="default" onClick={() => setAdding(true)}>
                <PlusIcon aria-hidden="true" /> Follow a feed
              </Button>
            ) : null}
          </header>
          {activeFeed ? (
            <FeedToolbar
              key={activeFeed.id}
              workspace={workspace}
              feed={activeFeed}
              onRemoved={() => setFeedId(undefined)}
            />
          ) : null}
          <Tabs
            value={view}
            onValueChange={(value) => {
              const selected = views.find((item) => item.value === value)

              if (selected) setView(selected.value)
            }}
          >
            <div className="reading-controls">
              <TabsList aria-label="Article filters" className="max-w-full">
                {views.map((item) => (
                  <TabsTab
                    key={item.value}
                    value={item.value}
                    className="max-sm:text-xs"
                  >
                    <item.icon aria-hidden="true" className="max-sm:hidden" />
                    {item.label}
                  </TabsTab>
                ))}
              </TabsList>
              <form
                className="search-form"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSearch(searchInput.trim())
                }}
              >
                <Input
                  type="search"
                  aria-label="Search articles"
                  placeholder="Search articles…"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value)

                    if (!event.target.value) setSearch("")
                  }}
                />
                <Button type="submit" size="icon" aria-label="Search articles">
                  <SearchIcon aria-hidden="true" />
                </Button>
              </form>
            </div>
            <div className="list-meta">
              <span>
                {search ? `Results for “${search}”` : currentView.description}
              </span>
              {search ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("")
                    setSearchInput("")
                  }}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              ) : null}
              <span
                className="ml-auto shrink-0 tabular-nums"
                aria-live="polite"
              >
                {articles.isFetching
                  ? "Updating…"
                  : `${articles.data?.length ?? 0} articles`}
              </span>
            </div>
            {views.map((item) => (
              <TabsPanel key={item.value} value={item.value}>
                {view === item.value ? (
                  <div className="article-list">
                    <ArticleResults
                      articles={articles}
                      noFeeds={feeds.data?.length === 0}
                      search={search}
                      view={view}
                      canEdit={canEdit}
                      onAdd={() => setAdding(true)}
                      onSelect={setArticle}
                    />
                  </div>
                ) : null}
              </TabsPanel>
            ))}
          </Tabs>
        </section>
      </main>
      <Modal
        open={mobileNav}
        onOpenChange={setMobileNav}
        title="Your reading"
        className="mobile-navigation"
      >
        {mobileNav ? navigation : null}
        <div className="mobile-account">
          <ThemeButton />
          <SignOutButton />
        </div>
      </Modal>
      <Modal
        open={adding}
        onOpenChange={setAdding}
        title="Follow a feed"
        description="Paste the RSS or Atom feed URL of a source you love."
      >
        <ValueForm
          label="Feed URL"
          type="url"
          placeholder="https://example.com/feed.xml"
          submitLabel="Follow feed"
          schema={feedUrl}
          onSubmit={async (url) => {
            const feed = await add.mutateAsync(url)
            setFeedId(feed.id)
            setView("all")
            setAdding(false)
          }}
        />
      </Modal>
      {article ? (
        <ArticleDetail
          key={article.id}
          article={article}
          workspaceId={workspace.id}
          onClose={() => setArticle(null)}
        />
      ) : null}
    </div>
  )
}
