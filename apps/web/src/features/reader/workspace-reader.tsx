import * as stylex from "@stylexjs/stylex"
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
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "ui/dialog"
import { Input } from "ui/input"
import { tokens } from "ui/styles/tokens.stylex"
import { Tabs, TabsList, TabsPanel, TabsTab } from "ui/tabs"

const styles = stylex.create({
  shell: {
    minHeight: "100dvh",
    paddingBlock: { default: 10, "@media (max-width: 700px)": 0 },
    paddingLeft: { default: 238, "@media (max-width: 700px)": 0 },
    paddingRight: { default: 10, "@media (max-width: 700px)": 0 },
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
  },
  skipLink: {
    position: "fixed",
    left: 15,
    top: { default: -100, ":focus": 15 },
    zIndex: 100,
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    padding: 12,
    ":focus-visible": {
      outlineWidth: 2,
      outlineStyle: "solid",
      outlineColor: tokens["--foreground"],
      outlineOffset: 3,
    },
  },
  sidebar: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    width: 238,
    display: { default: "flex", "@media (max-width: 700px)": "none" },
    flexDirection: "column",
    gap: 18,
    paddingTop: 24,
    paddingInline: 14,
    paddingBottom: 14,
    overflowY: "auto",
  },
  sidebarBrand: { paddingInline: 10 },
  sidebarBottom: { marginTop: "auto", paddingTop: 24 },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
    paddingTop: 14,
  },
  avatar: {
    display: "grid",
    placeItems: "center",
    width: 28,
    height: 28,
    flexShrink: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 7,
    backgroundColor: tokens["--background"],
    fontSize: 12,
  },
  profileName: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
  },
  main: {
    minHeight: {
      default: "calc(100dvh - 20px)",
      "@media (max-width: 700px)": "100dvh",
    },
    minWidth: 0,
    backgroundColor: tokens["--background"],
    borderWidth: { default: 1, "@media (max-width: 700px)": 0 },
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: { default: 14, "@media (max-width: 700px)": 0 },
    boxShadow: `0 1px 3px color-mix(in srgb, ${tokens["--foreground"]} 2%, transparent)`,
    ":focus-visible": {
      outlineWidth: 2,
      outlineStyle: "solid",
      outlineColor: tokens["--foreground"],
      outlineOffset: 3,
    },
  },
  context: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: tokens["--border"],
    paddingBlock: 10,
    paddingInline: { default: 28, "@media (max-width: 700px)": 12 },
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  mobileToggle: {
    display: { default: "inline-flex", "@media (min-width: 701px)": "none" },
  },
  icon: {
    width: { default: 18, "@media (min-width: 640px)": 16 },
    height: { default: 18, "@media (min-width: 640px)": 16 },
    flexShrink: 0,
  },
  workspaceName: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  foreground: { color: tokens["--foreground"] },
  role: {
    marginLeft: "auto",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    paddingInline: 8,
    paddingBlock: 2,
    fontSize: 12,
    textTransform: "capitalize",
  },
  content: {
    maxWidth: 1240,
    margin: "auto",
    paddingBlock: { default: 32, "@media (max-width: 1000px)": 24 },
    paddingInline: {
      default: 32,
      "@media (min-width: 701px) and (max-width: 1000px)": 24,
      "@media (max-width: 700px)": 16,
    },
  },
  header: {
    display: "flex",
    alignItems: {
      default: "center",
      "@media (max-width: 700px)": "flex-start",
    },
    flexDirection: { default: "row", "@media (max-width: 700px)": "column" },
    justifyContent: "space-between",
    gap: { default: 20, "@media (max-width: 700px)": 14 },
    marginBottom: { default: 30, "@media (max-width: 700px)": 22 },
  },
  headerBody: { minWidth: 0 },
  title: {
    margin: 0,
    fontSize: 25,
    lineHeight: 1.3,
    letterSpacing: "-0.7px",
    fontWeight: 650,
    overflowWrap: "anywhere",
  },
  description: {
    color: tokens["--muted-foreground"],
    marginTop: 5,
    marginBottom: 0,
    fontSize: 13,
    lineHeight: 1.6,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: { default: 16, "@media (max-width: 700px)": 12 },
  },
  tabsList: { maxWidth: "100%" },
  tab: { fontSize: { default: null, "@media (max-width: 639px)": 12 } },
  tabIcon: {
    display: { default: "block", "@media (max-width: 639px)": "none" },
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  searchForm: {
    display: "flex",
    gap: 6,
    width: { default: 265, "@media (max-width: 1000px)": "100%" },
  },
  searchControl: { flex: 1, minWidth: 0 },
  listMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    color: tokens["--muted-foreground"],
    fontSize: { default: 12, "@media (max-width: 700px)": 11 },
  },
  articleCount: {
    marginLeft: "auto",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  articleList: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 12,
    overflow: "hidden",
  },
  mobileNavigation: { marginTop: 20 },
  mobileAccount: { display: "flex", gap: 10, paddingTop: 20 },
})

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
    <div {...stylex.props(styles.shell)}>
      <a {...stylex.props(styles.skipLink)} href="#reading-list">
        Skip to articles
      </a>
      <aside {...stylex.props(styles.sidebar)}>
        <div {...stylex.props(styles.sidebarBrand)}>
          <Brand />
        </div>
        {navigation}
        <div {...stylex.props(styles.sidebarBottom)}>
          <div {...stylex.props(styles.profile)}>
            <span {...stylex.props(styles.avatar)}>
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span {...stylex.props(styles.profileName)}>{name}</span>
            <ThemeButton />
            <SignOutButton compact />
          </div>
        </div>
      </aside>
      <main {...stylex.props(styles.main)} id="reading-list" tabIndex={-1}>
        <div {...stylex.props(styles.context)}>
          <Button
            variant="ghost"
            size="icon"
            xstyle={styles.mobileToggle}
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <MenuIcon {...stylex.props(styles.icon)} aria-hidden="true" />
          </Button>
          <span {...stylex.props(styles.workspaceName)}>{workspace.name}</span>
          <span aria-hidden="true">/</span>
          <span {...stylex.props(styles.foreground)}>Reading</span>
          <span {...stylex.props(styles.role)}>{workspace.role}</span>
        </div>
        <section {...stylex.props(styles.content)} aria-labelledby="list-title">
          <header {...stylex.props(styles.header)}>
            <div {...stylex.props(styles.headerBody)}>
              <h1 id="list-title" {...stylex.props(styles.title)}>
                {activeFeed?.title ?? "Your reading"}
              </h1>
              <p {...stylex.props(styles.description)}>
                {activeFeed
                  ? "Every story from this source."
                  : "Catch up on your feeds. Keep what matters."}
              </p>
            </div>
            {canEdit ? (
              <Button variant="default" onClick={() => setAdding(true)}>
                <PlusIcon {...stylex.props(styles.icon)} aria-hidden="true" />
                Follow a feed
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
            <div {...stylex.props(styles.controls)}>
              <TabsList aria-label="Article filters" xstyle={styles.tabsList}>
                {views.map((item) => (
                  <TabsTab
                    key={item.value}
                    value={item.value}
                    xstyle={styles.tab}
                  >
                    <item.icon
                      aria-hidden="true"
                      {...stylex.props(styles.tabIcon)}
                    />
                    {item.label}
                  </TabsTab>
                ))}
              </TabsList>
              <search>
                <form
                  {...stylex.props(styles.searchForm)}
                  onSubmit={(event) => {
                    event.preventDefault()
                    setSearch(searchInput.trim())
                  }}
                >
                  <Input
                    controlXstyle={styles.searchControl}
                    type="search"
                    aria-label="Search articles"
                    placeholder="Search articles…"
                    value={searchInput}
                    onChange={(event) => {
                      setSearchInput(event.target.value)

                      if (!event.target.value) setSearch("")
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Search articles"
                  >
                    <SearchIcon
                      {...stylex.props(styles.icon)}
                      aria-hidden="true"
                    />
                  </Button>
                </form>
              </search>
            </div>
            <div {...stylex.props(styles.listMeta)}>
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
                  <XIcon {...stylex.props(styles.icon)} aria-hidden="true" />
                </Button>
              ) : null}
              <span {...stylex.props(styles.articleCount)} aria-live="polite">
                {articles.isFetching
                  ? "Updating…"
                  : `${articles.data?.length ?? 0} articles`}
              </span>
            </div>
            {views.map((item) => (
              <TabsPanel key={item.value} value={item.value}>
                {view === item.value ? (
                  <div {...stylex.props(styles.articleList)}>
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
      <Dialog open={mobileNav} onOpenChange={setMobileNav}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Your reading</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            {mobileNav ? (
              <div {...stylex.props(styles.mobileNavigation)}>{navigation}</div>
            ) : null}
            <div {...stylex.props(styles.mobileAccount)}>
              <ThemeButton />
              <SignOutButton />
            </div>
          </DialogPanel>
        </DialogPopup>
      </Dialog>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Follow a feed</DialogTitle>
            <DialogDescription>
              Paste the RSS or Atom feed URL of a source you love.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
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
          </DialogPanel>
        </DialogPopup>
      </Dialog>
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
