'use server';

import { DateRange } from 'react-day-picker';
import { db } from '@/lib/db';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { toDate } from 'date-fns-tz';
import { currentUser } from '@/lib/auth';

// Define types for our API responses
export type OverviewMetricsData = {
    followers: {
        value: string;
        change: string;
        positive: boolean;
    };
    engagement: {
        value: string;
        change: string;
        positive: boolean;
    };
    reach: {
        value: string;
        change: string;
        positive: boolean;
    };
};

export type FollowerGrowthData = {
    date: string;
    twitter?: number;
    facebook?: number;
    instagram?: number;
    linkedin?: number;
};

export type DataResponse<T> = {
    data: T | null;
    error: string | null;
    isError: boolean;
    isEmpty: boolean;
};

function formatValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    } else {
        return value.toString();
    }
}

function calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return '+0%';

    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function convertToUTC(date: Date, timezone: string): Date {
    // Dates coming from client via server actions are already UTC (from JSON serialization)
    // They represent the correct instant in time, so use them directly
    // This function is kept for backwards compatibility but no longer performs conversion
    return date;
}

function convertFromUTC(date: Date, timezone: string): Date {
    return toDate(date, { timeZone: timezone });
}

// Server action to fetch overview metrics
export async function fetchOverviewMetrics(
    dateRange: DateRange,
    platform?: 'facebook' | 'twitter' | 'linkedin',
): Promise<DataResponse<OverviewMetricsData>> {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        const fromDate = dateRange.from || subDays(new Date(), 30);
        const toDate = dateRange.to || new Date();

        // Convert dates to UTC for database query
        const utcFromDate = convertToUTC(fromDate, timezone);
        const utcToDate = convertToUTC(toDate, timezone);

        // Previous period with same duration for comparison
        const periodDuration = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - periodDuration);
        const previousToDate = new Date(toDate.getTime() - periodDuration);

        // Convert previous dates to UTC
        const utcPreviousFromDate = convertToUTC(previousFromDate, timezone);
        const utcPreviousToDate = convertToUTC(previousToDate, timezone);

        // Current period metrics - filter by platform if specified
        let currentMetrics: any[] = [];

        // Previous period metrics for comparison - filter by platform if specified
        let previousMetrics: any[] = [];

        switch (platform) {
            case 'facebook':
                const [currentFacebookMetrics, previousFacebookMetrics] =
                    await db.$transaction([
                        db.facebookAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcFromDate),
                                    lte: endOfDay(utcToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                        db.facebookAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcPreviousFromDate),
                                    lte: endOfDay(utcPreviousToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                    ]);

                currentMetrics = currentFacebookMetrics;
                previousMetrics = previousFacebookMetrics;
                break;

            case 'twitter':
                const [currentTwitterMetrics, previousTwitterMetrics] =
                    await db.$transaction([
                        db.twitterAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcFromDate),
                                    lte: endOfDay(utcToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                        db.twitterAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcPreviousFromDate),
                                    lte: endOfDay(utcPreviousToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                    ]);

                currentMetrics = currentTwitterMetrics;
                previousMetrics = previousTwitterMetrics;
                break;

            case 'linkedin':
                const [currentLinkedinMetrics, previousLinkedinMetrics] =
                    await db.$transaction([
                        db.linkedinAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcFromDate),
                                    lte: endOfDay(utcToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                        db.linkedinAnalytics.findMany({
                            where: {
                                userId,
                                organizationId: user.organizationId!,
                                date: {
                                    gte: startOfDay(utcPreviousFromDate),
                                    lte: endOfDay(utcPreviousToDate),
                                },
                            },
                            orderBy: {
                                date: 'desc',
                            },
                        }),
                    ]);

                currentMetrics = currentLinkedinMetrics;
                previousMetrics = previousLinkedinMetrics;
                break;
            default:
                currentMetrics = [];
                previousMetrics = [];
                break;
        }

        // Check if there's no data
        if (currentMetrics.length === 0 && previousMetrics.length === 0) {
            return {
                data: null,
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Calculate totals for current period
        const currentTotals = {
            followers: currentMetrics[0]?.followerCount || 0,
            engagement: currentMetrics.length
                ? currentMetrics.reduce(
                      (sum, record) => sum + record.engagementRate,
                      0,
                  ) / currentMetrics.length
                : 0,
            reach:
                platform === 'twitter'
                    ? currentMetrics.reduce(
                          (sum, record) => sum + record.views,
                          0,
                      )
                    : platform === 'linkedin'
                      ? currentMetrics.reduce(
                            (sum, record) => sum + record.impressions,
                            0,
                        )
                      : currentMetrics.reduce(
                            (sum, record) => sum + record.reach,
                            0,
                        ),
        };

        // Calculate totals for previous period
        const previousTotals = {
            followers: previousMetrics[0]?.followerCount || 0,
            engagement: previousMetrics.length
                ? previousMetrics.reduce(
                      (sum, record) => sum + record.engagementRate,
                      0,
                  ) / previousMetrics.length
                : 0,
            reach:
                platform === 'twitter'
                    ? previousMetrics.reduce(
                          (sum, record) => sum + record.views,
                          0,
                      )
                    : platform === 'linkedin'
                      ? previousMetrics.reduce(
                            (sum, record) => sum + record.impressions,
                            0,
                        )
                      : previousMetrics.reduce(
                            (sum, record) => sum + record.reach,
                            0,
                        ),
        };

        // Format metrics for display
        const metrics: OverviewMetricsData = {
            followers: {
                value: formatValue(currentTotals.followers),
                change: calculatePercentageChange(
                    currentTotals.followers,
                    previousTotals.followers,
                ),
                positive: currentTotals.followers >= previousTotals.followers,
            },
            engagement: {
                value: `${currentTotals.engagement.toFixed(2)}%`,
                change: calculatePercentageChange(
                    currentTotals.engagement,
                    previousTotals.engagement,
                ),
                positive: currentTotals.engagement >= previousTotals.engagement,
            },
            reach: {
                value: formatValue(currentTotals.reach),
                change: calculatePercentageChange(
                    currentTotals.reach,
                    previousTotals.reach,
                ),
                positive: currentTotals.reach >= previousTotals.reach,
            },
        };

        return {
            data: metrics,
            error: null,
            isError: false,
            isEmpty: false,
        };
    } catch (error) {
        console.error('Error fetching overview metrics:', error);
        return {
            data: null,
            error: 'Failed to fetch analytics data',
            isError: true,
            isEmpty: false,
        };
    }
}

// Fetch follower growth data
export async function fetchFollowerGrowth(
    dateRange: DateRange,
    platform?: 'facebook' | 'twitter' | 'linkedin',
): Promise<DataResponse<FollowerGrowthData[]>> {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        const fromDate = dateRange.from || subDays(new Date(), 30);
        const toDate = dateRange.to || new Date();

        // Convert dates to UTC for database query
        const utcFromDate = convertToUTC(fromDate, timezone);
        const utcToDate = convertToUTC(toDate, timezone);

        // Get analytics - filter by platform if specified
        let analyticsData: any[] = [];

        switch (platform) {
            case 'facebook':
                analyticsData = await db.facebookAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId!,
                        date: {
                            gte: startOfDay(utcFromDate),
                            lte: endOfDay(utcToDate),
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                });
                break;

            case 'twitter':
                analyticsData = await db.twitterAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId!,
                        date: {
                            gte: startOfDay(utcFromDate),
                            lte: endOfDay(utcToDate),
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                });
                break;

            case 'linkedin':
                analyticsData = await db.linkedinAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId!,
                        date: {
                            gte: startOfDay(utcFromDate),
                            lte: endOfDay(utcToDate),
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                });
                break;

            default:
                analyticsData = [];
                break;
        }

        // Check if no data is found
        if (analyticsData.length === 0) {
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Group by date (daily records)
        const dateGroups: Record<string, FollowerGrowthData> = {};

        analyticsData.forEach((record) => {
            const localDate = convertFromUTC(record.date, timezone);
            const dateStr = format(localDate, 'MMM d');
            if (!dateGroups[dateStr]) {
                dateGroups[dateStr] = { date: dateStr };
            }

            dateGroups[dateStr][platform!] = record.followerCount;
        });

        const result = Object.values(dateGroups);
        return {
            data: result,
            error: null,
            isError: false,
            isEmpty: result.length === 0,
        };
    } catch (error) {
        console.error('Error fetching follower growth:', error);
        return {
            data: null,
            error: 'Failed to fetch follower growth data',
            isError: true,
            isEmpty: false,
        };
    }
}

// Fetch engagement data for Twitter
export async function fetchTwitterEngagementData() {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        const fromDate = subDays(new Date(), 7);
        const toDate = new Date();

        // Convert dates to UTC for database query
        const utcFromDate = convertToUTC(fromDate, timezone);
        const utcToDate = convertToUTC(toDate, timezone);

        const analyticsRecords = await db.twitterAnalytics.findMany({
            where: {
                userId,
                organizationId: user.organizationId!,
                date: {
                    gte: startOfDay(utcFromDate),
                    lte: endOfDay(utcToDate),
                },
            },
            orderBy: {
                date: 'desc',
            },
            select: {
                date: true,
                favorites: true,
                replies: true,
                retweets: true,
            },
        });

        // Check if no data is found
        if (analyticsRecords.length === 0) {
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Format data for the chart
        const engagementData = analyticsRecords.map((record) => {
            const localDate = convertFromUTC(record.date, timezone);
            const dateStr = format(localDate, 'MMM d');
            // Twitter analytics record
            return {
                date: dateStr,
                favorites: record.favorites,
                replies: record.replies,
                retweets: record.retweets,
            };
        });

        return {
            data: engagementData,
            error: null,
            isError: false,
            isEmpty: engagementData.length === 0,
        };
    } catch (error) {
        console.error('Error fetching engagement data:', error);
        return {
            data: null,
            error: 'Failed to fetch engagement data',
            isError: true,
            isEmpty: false,
        };
    }
}

// Fetch engagement data for Linkedin
export async function fetchLinkedinEngagementData() {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        const fromDate = subDays(new Date(), 7);
        const toDate = new Date();

        // Convert dates to UTC for database query
        const utcFromDate = convertToUTC(fromDate, timezone);
        const utcToDate = convertToUTC(toDate, timezone);

        const analyticsRecords = await db.linkedinAnalytics.findMany({
            where: {
                userId,
                organizationId: user.organizationId!,
                date: {
                    gte: startOfDay(utcFromDate),
                    lte: endOfDay(utcToDate),
                },
            },
            orderBy: {
                date: 'desc',
            },
            select: {
                date: true,
                likes: true,
                comments: true,
                shares: true,
                clicks: true,
            },
        });

        // Check if no data is found
        if (analyticsRecords.length === 0) {
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Format data for the chart
        const engagementData = analyticsRecords.map((record) => {
            const localDate = convertFromUTC(record.date, timezone);
            const dateStr = format(localDate, 'MMM d');
            // Twitter analytics record
            return {
                date: dateStr,
                likes: record.likes,
                comments: record.comments,
                shares: record.shares,
                clicks: record.clicks,
            };
        });

        return {
            data: engagementData,
            error: null,
            isError: false,
            isEmpty: engagementData.length === 0,
        };
    } catch (error) {
        console.error('Error fetching engagement data:', error);
        return {
            data: null,
            error: 'Failed to fetch engagement data',
            isError: true,
            isEmpty: false,
        };
    }
}

// Fetch reactions data for Facebook
export async function fetchReactionsData() {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        const fromDate = subDays(new Date(), 7);
        const toDate = new Date();

        // Convert dates to UTC for database query
        const utcFromDate = convertToUTC(fromDate, timezone);
        const utcToDate = convertToUTC(toDate, timezone);

        const latestAnalytics = await db.facebookAnalytics.findMany({
            where: {
                userId,
                organizationId: user.organizationId!,
                date: {
                    gte: startOfDay(utcFromDate),
                    lte: endOfDay(utcToDate),
                },
            },
            select: {
                date: true,
                reactions: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        // Check if no data is found
        if (latestAnalytics.length === 0) {
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Format data for the chart
        const reactionsData = latestAnalytics.map((record) => {
            const localDate = convertFromUTC(record.date, timezone);
            const dateStr = format(localDate, 'MMM d');
            const reactions = record.reactions as {
                like: number;
                love: number;
                wow: number;
                haha: number;
                sorry: number;
                anger: number;
            };
            return {
                date: dateStr,
                like: reactions?.like || 0,
                love: reactions?.love || 0,
                wow: reactions?.wow || 0,
                haha: reactions?.haha || 0,
                sorry: reactions?.sorry || 0,
                anger: reactions?.anger || 0,
            };
        });

        return {
            data: reactionsData,
            error: null,
            isError: false,
            isEmpty: reactionsData.length === 0,
        };
    } catch (error) {
        console.error('Error fetching engagement data:', error);
        return {
            data: null,
            error: 'Failed to fetch engagement data',
            isError: true,
            isEmpty: false,
        };
    }
}
