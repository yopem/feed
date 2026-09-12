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
      view={view}
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
          <div className="license">
            Made for readers <span>AGPL-3.0</span>
          </div>
        </div>
      </aside>
      <main className="reading-main" id="reading-list" tabIndex={-1}>
        <header className="topbar">
          <Button
            className="icon-button mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <MenuIcon aria-hidden="true" />
          </Button>
          <span className="breadcrumb">
            {workspace.name}
            <span>/</span>
            {activeFeed ? activeFeed.title : "Your reading"}
          </span>
          <form
            className="search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(searchInput.trim())
            }}
          >
            <SearchIcon aria-hidden="true" />
            <input
              type="search"
              aria-label="Search articles"
              placeholder="Search articles…"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
                if (!event.target.value) setSearch("")
              }}
            />
            <Button type="submit" className="search-submit">
              Search
            </Button>
          </form>
        </header>
        <section className="reading-content" aria-labelledby="list-title">
          <div className="list-heading">
            <div>
              <div className="eyebrow">YOUR DAILY READING</div>
              <h1 id="list-title">{activeFeed?.title ?? currentView.label}</h1>
              <p>
                {activeFeed
                  ? "Stories from this source, all in one place."
                  : currentView.description}
              </p>
            </div>
            {canEdit ? (
              <Button
                className="primary follow-header"
                onClick={() => setAdding(true)}
              >
                <PlusIcon aria-hidden="true" /> Follow a feed
              </Button>
            ) : null}
          </div>
          {activeFeed ? (
            <FeedToolbar
              key={activeFeed.id}
              workspace={workspace}
              feed={activeFeed}
              onRemoved={() => setFeedId(undefined)}
            />
          ) : null}
          <div className="list-meta">
            <span>
              {search ? `Results for “${search}”` : "Latest articles"}
            </span>
            <span aria-live="polite">
              {articles.isFetching
                ? "Updating…"
                : `${articles.data?.length ?? 0} articles`}
            </span>
            {search ? (
              <Button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("")
                  setSearchInput("")
                }}
              >
                <XIcon aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <ArticleResults
            articles={articles}
            noFeeds={feeds.data?.length === 0}
            search={search}
            view={view}
            canEdit={canEdit}
            onAdd={() => setAdding(true)}
            onSelect={setArticle}
          />
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
