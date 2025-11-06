"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useTRPC } from "@/lib/trpc/client"

interface ArticleActionsProps {
  articleId: string
  isRead: boolean
  isStarred: boolean
  isReadLater: boolean
  link: string
}

export function ArticleActions({
  articleId,
  isRead,
  isStarred,
  isReadLater,
  link,
}: ArticleActionsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateRead = useMutation(
    trpc.article.updateReadStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
        await queryClient.invalidateQueries(trpc.feed.pathFilter())
      },
    }),
  )

  const updateStarred = useMutation(
    trpc.article.updateStarred.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
      },
    }),
  )

  const updateReadLater = useMutation(
    trpc.article.updateReadLater.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.article.pathFilter())
      },
    }),
  )

  return (
    <div className="border-border flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {/* Mark as Read/Unread */}
        <button
          onClick={() => updateRead.mutate({ id: articleId, isRead: !isRead })}
          className="hover:bg-accent rounded-md p-2 transition-colors"
          title={isRead ? "Mark as unread" : "Mark as read"}
        >
          <svg
            className="text-muted-foreground h-5 w-5"
            fill={isRead ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Star/Unstar */}
        <button
          onClick={() =>
            updateStarred.mutate({ id: articleId, isStarred: !isStarred })
          }
          className="hover:bg-accent rounded-md p-2 transition-colors"
          title={isStarred ? "Remove star" : "Add star"}
        >
          <svg
            className="text-primary h-5 w-5"
            fill={isStarred ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>

        {/* Read Later */}
        <button
          onClick={() =>
            updateReadLater.mutate({
              id: articleId,
              isReadLater: !isReadLater,
            })
          }
          className="hover:bg-accent rounded-md p-2 transition-colors"
          title={isReadLater ? "Remove from read later" : "Read later"}
        >
          <svg
            className="text-primary h-5 w-5"
            fill={isReadLater ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* Open Original Link */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
      >
        <span>Open Original</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  )
}
