"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import {
  BarChart3Icon,
  EyeIcon,
  GlobeIcon,
  LinkIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTRPC } from "@/lib/trpc/client"

interface ShareAnalyticsData {
  totalViews: number
  uniqueViews: number
  shareViewCount: number
  shareLastViewedAt: Date | null
  viewsOverTime: { date: string; views: number }[]
  topReferrers: { referer: string; count: number }[]
  geographicData: { country: string; count: number }[]
}

interface ShareAnalyticsDialogProps {
  isOpen: boolean
  onClose: () => void
  articleId: string
  articleTitle: string
}

/**
 * Displays analytics for shared articles
 *
 * Shows metrics including total views, unique viewers, time series data,
 * top referrers, and geographic distribution
 */
export function ShareAnalyticsDialog({
  isOpen,
  onClose,
  articleId,
  articleTitle,
}: ShareAnalyticsDialogProps) {
  const trpc = useTRPC()

  const articleQueryOptions = useMemo(
    () => trpc.article.byId.queryOptions(articleId),
    [articleId, trpc.article.byId],
  )

  const { data: article } = useQuery({
    ...articleQueryOptions,
    enabled: isOpen && !!articleId,
  })

  const { data, isLoading } = useQuery({
    ...trpc.article.getShareAnalytics.queryOptions({ id: articleId }),
    enabled: isOpen && !!articleId && !!article?.isPubliclyShared,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const analytics = data as ShareAnalyticsData | undefined

  if (!isOpen) return null

  if (!article?.isPubliclyShared) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analytics Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              This article is not publicly shared. Enable sharing to view
              analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Share Analytics</AlertDialogTitle>
          <AlertDialogDescription>
            Analytics for "{articleTitle}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <LoadingSkeleton variant="text" count={4} className="h-24" />
          </div>
        ) : analytics ? (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <EyeIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalViews.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    All time views
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unique Viewers
                  </CardTitle>
                  <UsersIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.uniqueViews.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Distinct visitors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Viewed
                  </CardTitle>
                  <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {article.shareLastViewedAt
                      ? dayjs(article.shareLastViewedAt).fromNow()
                      : "Never"}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Most recent view
                  </p>
                </CardContent>
              </Card>
            </div>

            {analytics.viewsOverTime.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3Icon className="h-4 w-4" />
                    Views Over Time (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.viewsOverTime
                      .slice(0, 10)
                      .map((day: { date: string; views: number }) => (
                        <div
                          key={day.date}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground text-sm">
                            {dayjs(day.date).format("MMM D, YYYY")}
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.max((day.views / Math.max(...analytics.viewsOverTime.map((d: { views: number }) => d.views))) * 200, 20)}px`,
                              }}
                            />
                            <span className="text-foreground w-12 text-right text-sm font-medium">
                              {day.views}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analytics.topReferrers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LinkIcon className="h-4 w-4" />
                    Top Referrers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topReferrers.map(
                      (
                        referrer: { referer: string; count: number },
                        index: number,
                      ) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-foreground truncate text-sm">
                              {referrer.referer === "direct" ||
                              referrer.referer === "Direct"
                                ? "Direct / None"
                                : referrer.referer}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {referrer.count} views
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {analytics.geographicData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GlobeIcon className="h-4 w-4" />
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.geographicData.map(
                      (
                        geo: { country: string; count: number },
                        index: number,
                      ) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-foreground text-sm">
                            {geo.country || "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {geo.count} views
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {analytics.totalViews === 0 && (
              <div className="border-border rounded-lg border-2 p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No views yet. Share your link to start tracking analytics!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="border-border rounded-lg border-2 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Unable to load analytics. Please try again later.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
