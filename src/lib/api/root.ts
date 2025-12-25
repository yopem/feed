import { articleRouter } from "./routers/article"

// import { feedRouter } from "./routers/feed"
// import { tagRouter } from "./routers/tag"
// import { userRouter } from "./routers/user"

export const appRouter = {
  article: articleRouter,
  // feed: feedRouter,
  // tag: tagRouter,
  // user: userRouter,
}

export type AppRouter = typeof appRouter
