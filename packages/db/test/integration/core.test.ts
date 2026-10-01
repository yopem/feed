import { afterEach, describe, expect, test } from "bun:test"
import { eq, inArray } from "drizzle-orm"

import { db } from "db/index"
import { articles, readingStates } from "db/schema/articles"
import { feeds } from "db/schema/feeds"
import { users } from "db/schema/users"
import { memberships, workspaces } from "db/schema/workspaces"
import { requireMembership } from "db/services/access"
import { listArticles, setArticleState } from "db/services/articles"
import {
  addFeed,
  getFeed,
  listFeeds,
  refreshStoredFeed,
  removeFeed,
} from "db/services/feeds"
import { findUser, provisionUser } from "db/services/users"
import { createWorkspace, listWorkspaces } from "db/services/workspaces"
import { testEnv } from "env/testing"
import { createId } from "utils/id"

describe.skipIf(!testEnv.RUN_DB_TESTS)("PostgreSQL core services", () => {
  const userIds: string[] = []
  const workspaceIds: string[] = []

  afterEach(async () => {
    try {
      if (workspaceIds.length) {
        await db.delete(workspaces).where(inArray(workspaces.id, workspaceIds))
      }
    } finally {
      if (userIds.length) {
        await db.delete(users).where(inArray(users.id, userIds))
      }

      workspaceIds.length = 0
      userIds.length = 0
    }
  })

  async function rejects(
    promise: Promise<unknown>,
    expected: { status: number; message?: string },
  ) {
    const result = await promise.then(
      () => null,
      (error: unknown) => error,
    )

    expect(result).toBeInstanceOf(Error)
    expect(result).toMatchObject(expected)
  }

  async function user(
    subjectId = `external|${createId()}`,
    issuer = "https://issuer.invalid",
  ) {
    const created = await provisionUser(
      issuer,
      {
        id: subjectId,
        email: `${createId()}@example.invalid`,
        name: "Fixture",
      },
      true,
    )

    userIds.push(created.id)

    return created
  }

  async function workspace(userId: string) {
    const created = await createWorkspace(userId, `Fixture ${createId()}`)
    workspaceIds.push(created.id)

    return created
  }

  async function fixture() {
    const owner = await user()
    const editor = await user()
    const viewer = await user()
    const outsider = await user()
    const first = await workspace(owner.id)
    const second = await workspace(owner.id)
    await db.insert(memberships).values([
      { workspaceId: first.id, userId: editor.id, role: "editor" },
      { workspaceId: first.id, userId: viewer.id, role: "viewer" },
      { workspaceId: second.id, userId: viewer.id, role: "viewer" },
    ])
    const url = `https://rss.invalid/${createId()}`
    const feed = await addFeed(owner.id, first.id, url)
    const otherFeed = await addFeed(owner.id, second.id, url)

    const result = {
      title: "Fixture feed",
      articles: [
        {
          guid: "external:shared-guid",
          title: "Fixture article",
          url: "https://article.invalid/one",
          content: "Stored content",
          publishedAt: new Date("2025-01-01T00:00:00Z"),
        },
      ],
    }

    for (const stored of [feed, otherFeed]) {
      await refreshStoredFeed(stored, (requestedUrl) => {
        expect(requestedUrl).toBe(url)

        return Promise.resolve(result)
      })
    }

    const [article] = await listArticles(owner.id, { workspaceId: first.id })

    const [otherArticle] = await listArticles(owner.id, {
      workspaceId: second.id,
    })

    if (!article || !otherArticle) throw new Error("Fixture articles missing")

    return {
      owner,
      editor,
      viewer,
      outsider,
      first,
      second,
      feed,
      otherFeed,
      article,
      otherArticle,
      result,
    }
  }

  test("provisions local UUIDs for external identities and respects signup policy", async () => {
    const subjectId = `provider|not-a-uuid:${createId()}`
    const issuer = "https://first-issuer.invalid"

    const profile = {
      id: subjectId,
      email: `${createId()}@example.invalid`,
      name: null,
    }

    await rejects(provisionUser(issuer, profile, false), {
      message: "Signup is disabled",
      status: 403,
    })
    expect(await findUser(issuer, subjectId)).toBeNull()
    const created = await user(subjectId, issuer)
    expect(created.id).toMatch(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i)
    expect(created.id).not.toBe(subjectId)
    const updated = await provisionUser(issuer, profile, false)
    expect(updated).toMatchObject({
      id: created.id,
      email: profile.email,
      name: profile.email,
    })
    expect(await findUser(issuer, subjectId)).toEqual({
      id: created.id,
      email: profile.email,
      name: profile.email,
    })
    const other = await user(subjectId, "https://second-issuer.invalid")
    expect(other.id).not.toBe(created.id)
    expect(await findUser(other.issuer, subjectId)).toEqual({
      id: other.id,
      name: other.name,
      email: other.email,
    })
    expect(
      await findUser("https://unknown-issuer.invalid", subjectId),
    ).toBeNull()
  })

  test("enforces owner/editor/viewer access and outsider isolation", async () => {
    const f = await fixture()
    expect(await listWorkspaces(f.owner.id)).toEqual(
      expect.arrayContaining([
        { id: f.first.id, name: f.first.name, role: "owner" },
        { id: f.second.id, name: f.second.name, role: "owner" },
      ]),
    )
    expect(await listWorkspaces(f.editor.id)).toEqual([
      { id: f.first.id, name: f.first.name, role: "editor" },
    ])
    expect(await listWorkspaces(f.viewer.id)).toHaveLength(2)
    expect(await listWorkspaces(f.outsider.id)).toEqual([])

    for (const member of [f.owner, f.editor, f.viewer]) {
      await requireMembership(member.id, f.first.id)
      expect(await listFeeds(member.id, f.first.id)).toHaveLength(1)
      expect(
        await listArticles(member.id, { workspaceId: f.first.id }),
      ).toHaveLength(1)
    }

    for (const writer of [f.owner, f.editor]) {
      await requireMembership(writer.id, f.first.id, true)

      const added = await addFeed(
        writer.id,
        f.first.id,
        `https://rss.invalid/${createId()}`,
      )

      expect((await getFeed(writer.id, f.first.id, added.id)).id).toBe(added.id)
      await removeFeed(writer.id, f.first.id, added.id)
    }

    for (const blocked of [f.viewer, f.outsider]) {
      await rejects(requireMembership(blocked.id, f.first.id, true), {
        status: 403,
      })
      await rejects(
        addFeed(blocked.id, f.first.id, "https://rss.invalid/denied"),
        { status: 403 },
      )
      await rejects(getFeed(blocked.id, f.first.id, f.feed.id), { status: 403 })
      await rejects(removeFeed(blocked.id, f.first.id, f.feed.id), {
        status: 403,
      })
    }

    await rejects(requireMembership(f.outsider.id, f.first.id), { status: 403 })
    await rejects(listFeeds(f.outsider.id, f.first.id), {
      status: 403,
    })
    await rejects(listArticles(f.outsider.id, { workspaceId: f.first.id }), {
      status: 403,
    })
    await rejects(
      setArticleState(f.outsider.id, {
        workspaceId: f.first.id,
        articleId: f.article.id,
        read: true,
      }),
      { status: 403 },
    )
    expect(await listFeeds(f.owner.id, f.first.id)).toHaveLength(1)
  })

  test("isolates personal reading state across users and workspaces", async () => {
    const f = await fixture()
    await setArticleState(f.viewer.id, {
      workspaceId: f.first.id,
      articleId: f.article.id,
      read: true,
      starred: true,
      saved: true,
    })
    await setArticleState(f.viewer.id, {
      workspaceId: f.first.id,
      articleId: f.article.id,
      read: false,
    })
    expect(
      await listArticles(f.viewer.id, { workspaceId: f.first.id }),
    ).toEqual([{ ...f.article, read: false, starred: true, saved: true }])

    for (const view of ["unread", "starred", "saved"] as const) {
      expect(
        await listArticles(f.viewer.id, { workspaceId: f.first.id, view }),
      ).toHaveLength(1)
    }

    expect(await listArticles(f.owner.id, { workspaceId: f.first.id })).toEqual(
      [f.article],
    )
    expect(
      await listArticles(f.owner.id, {
        workspaceId: f.first.id,
        view: "starred",
      }),
    ).toEqual([])
    expect(
      await listArticles(f.viewer.id, { workspaceId: f.second.id }),
    ).toEqual([f.otherArticle])
    expect(
      await listArticles(f.viewer.id, {
        workspaceId: f.second.id,
        view: "saved",
      }),
    ).toEqual([])
    await setArticleState(f.viewer.id, {
      workspaceId: f.first.id,
      articleId: f.article.id,
      read: true,
      starred: false,
      saved: false,
    })

    for (const view of ["unread", "starred", "saved"] as const) {
      expect(
        await listArticles(f.viewer.id, { workspaceId: f.first.id, view }),
      ).toEqual([])
    }

    expect(
      await db
        .select()
        .from(readingStates)
        .where(eq(readingStates.articleId, f.article.id)),
    ).toEqual([
      {
        articleId: f.article.id,
        userId: f.viewer.id,
        read: true,
        starred: false,
        saved: false,
      },
    ])
  })

  test("rejects foreign feed/article IDs even for members of both workspaces", async () => {
    const f = await fixture()
    await rejects(getFeed(f.owner.id, f.first.id, f.otherFeed.id), {
      status: 404,
    })
    await rejects(removeFeed(f.owner.id, f.first.id, f.otherFeed.id), {
      status: 404,
    })
    await rejects(
      setArticleState(f.owner.id, {
        workspaceId: f.first.id,
        articleId: f.otherArticle.id,
        starred: true,
      }),
      { status: 404 },
    )
    expect(
      await listArticles(f.owner.id, {
        workspaceId: f.first.id,
        feedId: f.otherFeed.id,
      }),
    ).toEqual([])
    expect(
      await listArticles(f.owner.id, { workspaceId: f.second.id }),
    ).toEqual([f.otherArticle])
    expect((await getFeed(f.owner.id, f.second.id, f.otherFeed.id)).id).toBe(
      f.otherFeed.id,
    )
    expect(
      await db
        .select()
        .from(readingStates)
        .where(eq(readingStates.articleId, f.otherArticle.id)),
    ).toEqual([])
  })

  test("refresh upserts by guid, retains content on failure, and removal cascades", async () => {
    const f = await fixture()
    expect((await addFeed(f.owner.id, f.first.id, f.feed.url)).id).toBe(
      f.feed.id,
    )
    await setArticleState(f.viewer.id, {
      workspaceId: f.first.id,
      articleId: f.article.id,
      saved: true,
    })

    const revised = {
      title: "Updated feed",
      articles: f.result.articles.map((article) => ({
        ...article,
        title: "Updated article",
        content: "Updated content",
        url: "https://article.invalid/updated",
        publishedAt: null,
      })),
    }

    await refreshStoredFeed(f.feed, () => Promise.resolve(revised))
    await refreshStoredFeed(f.feed, () => Promise.resolve(revised))
    const stored = await listArticles(f.viewer.id, { workspaceId: f.first.id })
    expect(stored).toEqual([
      {
        ...f.article,
        feedTitle: "Updated feed",
        title: "Updated article",
        content: "Updated content",
        url: "https://article.invalid/updated",
        publishedAt: null,
        saved: true,
      },
    ])
    expect(
      await db.select().from(articles).where(eq(articles.feedId, f.feed.id)),
    ).toHaveLength(1)
    await refreshStoredFeed(f.feed, () =>
      Promise.reject(new Error("Fixture fetch failed")),
    )
    expect(
      await listArticles(f.viewer.id, { workspaceId: f.first.id }),
    ).toEqual(stored)
    expect(await getFeed(f.owner.id, f.first.id, f.feed.id)).toMatchObject({
      title: revised.title,
      error: "Feed refresh failed",
      lastFetchedAt: expect.any(Date),
    })
    await refreshStoredFeed(f.feed, () => Promise.resolve(revised))
    expect((await getFeed(f.owner.id, f.first.id, f.feed.id)).error).toBeNull()
    await removeFeed(f.editor.id, f.first.id, f.feed.id)
    expect(
      await db.select().from(feeds).where(eq(feeds.id, f.feed.id)),
    ).toEqual([])
    expect(
      await db.select().from(articles).where(eq(articles.feedId, f.feed.id)),
    ).toEqual([])
    expect(
      await db
        .select()
        .from(readingStates)
        .where(eq(readingStates.articleId, f.article.id)),
    ).toEqual([])
    expect(
      await listArticles(f.viewer.id, { workspaceId: f.second.id }),
    ).toEqual([f.otherArticle])
  })
})
