"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  BarChart3Icon,
  EyeIcon,
  GlobeIcon,
  LinkIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTRPC } from "@/lib/trpc/client"

dayjs.extend(relativeTime)

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
    refetchInterval: 30000,
  })

  const analytics = data as ShareAnalyticsData | undefined

  const getCountryName = (code: string) => {
    if (code === "Unknown") return "Unknown"
    try {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" })
      return regionNames.of(code) ?? code
    } catch {
      return code
    }
  }

  if (!isOpen) return null

  if (!article?.isPubliclyShared) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Analytics Unavailable</DialogTitle>
            <DialogDescription>
              This article is not publicly shared. Enable sharing to view
              analytics.
            </DialogDescription>
          </DialogHeader>
        </DialogPopup>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPopup className="max-h-[90vh] !max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Analytics</DialogTitle>
          <DialogDescription>Analytics for "{articleTitle}"</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <LoadingSkeleton variant="text" count={4} className="h-24" />
          </div>
        ) : analytics ? (
          <div className="space-y-6 py-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <EyeIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardPanel>
                  <div className="text-3xl font-bold">
                    {analytics.totalViews.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    All time views
                  </p>
                </CardPanel>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unique Viewers
                  </CardTitle>
                  <UsersIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardPanel>
                  <div className="text-3xl font-bold">
                    {analytics.uniqueViews.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Distinct visitors
                  </p>
                </CardPanel>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Viewed
                  </CardTitle>
                  <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardPanel>
                  <div className="text-xl font-bold">
                    {analytics.shareLastViewedAt
                      ? dayjs(analytics.shareLastViewedAt).fromNow()
                      : "Never"}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Most recent view
                  </p>
                </CardPanel>
              </Card>
            </div>

            {analytics.viewsOverTime.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    Views Over Time (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardPanel>
                  <div className="space-y-3">
                    {analytics.viewsOverTime
                      .slice(0, 10)
                      .map((day: { date: string; views: number }) => (
                        <div
                          key={day.date}
                          className="grid grid-cols-[120px_1fr_60px] items-center gap-4"
                        >
                          <span className="text-muted-foreground text-sm">
                            {dayjs(day.date).format("MMM D, YYYY")}
                          </span>
                          <div className="bg-muted relative h-6 overflow-hidden">
                            <div
                              className="bg-foreground h-full"
                              style={{
                                width: `${(day.views / Math.max(...analytics.viewsOverTime.map((d: { views: number }) => d.views))) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-foreground text-right text-base font-bold">
                            {day.views}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardPanel>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {analytics.topReferrers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Top Referrers
                    </CardTitle>
                  </CardHeader>
                  <CardPanel>
                    <div className="space-y-3">
                      {analytics.topReferrers.map(
                        (
                          referrer: { referer: string; count: number },
                          index: number,
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                          >
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="text-foreground truncate text-sm">
                              {referrer.referer === "direct" ||
                              referrer.referer === "Direct"
                                ? "Direct / None"
                                : referrer.referer}
                            </span>
                            <span className="text-muted-foreground text-sm whitespace-nowrap">
                              {referrer.count} views
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardPanel>
                </Card>
              )}

              {analytics.geographicData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GlobeIcon className="h-5 w-5" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardPanel>
                    <div className="space-y-3">
                      {analytics.geographicData.map(
                        (
                          geo: { country: string; count: number },
                          index: number,
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_auto] items-center gap-3"
                          >
                            <span className="text-foreground truncate text-sm">
                              {getCountryName(geo.country)}
                            </span>
                            <span className="text-muted-foreground text-sm whitespace-nowrap">
                              {geo.count} views
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardPanel>
                </Card>
              )}
            </div>

            {analytics.totalViews === 0 && (
              <Card>
                <CardPanel className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    No views yet. Share your link to start tracking analytics!
                  </p>
                </CardPanel>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardPanel className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Unable to load analytics. Please try again later.
              </p>
            </CardPanel>
          </Card>
        )}
      </DialogPopup>
    </Dialog>
  )
}
