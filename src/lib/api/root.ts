import { createCallerFactory, createTRPCRouter } from "@/lib/api/trpc"
import { articleRouter } from "./routers/article"
import { feedRouter } from "./routers/feed"
import { tagRouter } from "./routers/tag"

export const appRouter = createTRPCRouter({
  article: articleRouter,
  feed: feedRouter,
  tag: tagRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
