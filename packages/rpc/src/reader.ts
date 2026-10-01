import type { InferRequestType, InferResponseType } from "hono/client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authClient, client } from "rpc/client"

export type Article = InferResponseType<
  typeof client.rpc.article.list.$get,
  200
>["articles"][number]

export type ArticleFilter = InferRequestType<
  typeof client.rpc.article.list.$get
>["query"]

export type Workspace = InferResponseType<
  typeof client.rpc.workspace.list.$get,
  200
>["workspaces"][number]

export type ArticleState = InferRequestType<
  typeof client.rpc.article.state.$post
>["json"]

export function useLogout() {
  const cache = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await authClient.logout.$post()

      if (!response.ok) throw new Error("Could not sign out. Try again.")

      return response.json()
    },
    onSuccess: async () => {
      await cache.cancelQueries()
      cache.setQueryData(["session"], { user: null })
      cache.removeQueries({
        predicate: (query) => query.queryKey[0] !== "session",
      })
    },
  })
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await client.rpc.session.$get()
      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data
    },
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await client.rpc.workspace.list.$get()
      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data.workspaces
    },
  })
}

export function useFeeds(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "feeds"],
    queryFn: async ({ signal }) => {
      const response = await client.rpc.feed.list.$get(
        { query: { workspaceId } },
        { init: { signal } },
      )

      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data.feeds
    },
  })
}

export function useArticles(query: ArticleFilter) {
  return useQuery({
    queryKey: ["workspace", query.workspaceId, "articles", query],
    queryFn: async ({ signal }) => {
      const response = await client.rpc.article.list.$get(
        { query },
        { init: { signal } },
      )

      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data.articles
    },
  })
}

export function useCreateWorkspace() {
  const cache = useQueryClient()

  return useMutation({
    mutationFn: async (
      json: InferRequestType<typeof client.rpc.workspace.create.$post>["json"],
    ) => {
      const response = await client.rpc.workspace.create.$post({ json })
      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data.workspace
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["workspaces"] }),
  })
}

export function useAddFeed(workspaceId: string) {
  const cache = useQueryClient()

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await client.rpc.feed.add.$post({
        json: { workspaceId, url },
      })

      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data.feed
    },
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
  })
}

export function useFeedAction(
  workspaceId: string,
  action: "remove" | "refresh",
) {
  const cache = useQueryClient()

  return useMutation({
    mutationFn: async (feedId: string) => {
      const response = await client.rpc.feed[action].$post({
        json: { workspaceId, feedId },
      })

      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data
    },
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
  })
}

export function useArticleState(workspaceId: string) {
  const cache = useQueryClient()

  return useMutation({
    mutationFn: async (state: Omit<ArticleState, "workspaceId">) => {
      const response = await client.rpc.article.state.$post({
        json: { ...state, workspaceId },
      })

      const data = await response.json()

      if ("error" in data) throw new Error(data.error)

      return data
    },
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
  })
}
