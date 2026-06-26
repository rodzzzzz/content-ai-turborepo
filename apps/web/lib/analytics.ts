import { db } from '@/lib/db';
import { subDays, format } from 'date-fns';
import { Integration } from '@prisma/client';

// Types for analytics data
export interface AnalyticsResult {
    success: boolean;
    message: string;
}

export interface TwitterAnalyticsData {
    date: Date;
    followerCount: number;
    followerGrowth: number;
    favorites: number;
    retweets: number;
    replies: number;
    totalEngagements: number;
    engagementRate: number;
    views: number;
    integrationId: string;
    userId: string;
    organizationId: string;
}

export interface LinkedInAnalyticsData {
    date: Date;
    followerCount: number;
    followerGrowth: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    totalEngagements: number;
    engagementRate: number;
    impressions: number;
    integrationId: string;
    userId: string;
    organizationId: string;
}

export interface FacebookAnalyticsData {
    date: Date;
    followerCount: number;
    followerGrowth: number;
    reactions: {
        like: number;
        love: number;
        wow: number;
        haha: number;
        sorry: number;
        anger: number;
    };
    totalEngagements: number;
    engagementRate: number;
    reach: number;
    impressions: number;
    integrationId: string;
    userId: string;
    organizationId: string;
}

// Helper function to calculate engagement rate
export const calculateEngagementRate = (
    totalEngagements: number,
    followerCount: number,
): number => {
    const engagementRate =
        followerCount > 0 ? (totalEngagements / followerCount) * 100 : 0;
    return Math.round(engagementRate * 100) / 100;
};

// Helper function to fetch Twitter posts and calculate daily analytics
export async function fetchTwitterAnalytics(
    integration: IntegrationForAnalytics,
): Promise<AnalyticsResult> {
    try {
        if (!integration.access_token) {
            throw new Error('No access token available');
        }

        const analyticsEntry: TwitterAnalyticsData = {
            date: new Date(),
            followerCount: 0,
            followerGrowth: 0,
            favorites: 0,
            retweets: 0,
            replies: 0,
            totalEngagements: 0,
            engagementRate: 0,
            views: 0,
            integrationId: integration.id,
            userId: integration.userId,
            organizationId: integration.organizationId,
        };

        const twitterUserResponse = await fetch(
            `https://api.apify.com/v2/acts/kaitoeasyapi~premium-twitter-user-scraper-pay-per-result/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_ids: [integration.providerAccountId],
                }),
            },
        );

        if (!twitterUserResponse.ok) {
            console.error(
                'Error fetching Twitter tweets: Failed to fetch user data',
            );
            return {
                success: false,
                message: 'Failed to fetch Twitter user data',
            };
        }

        const followerData: {
            rest_id: string;
            relationship_counts: { followers: number };
            core: { screen_name: string };
        }[] = await twitterUserResponse.json();

        // Extract follower count from the Apify API response structure
        if (
            followerData &&
            Array.isArray(followerData) &&
            followerData.length > 0
        ) {
            // Find the user whose rest_id matches the providerAccountId
            const userData = followerData.find(
                (user) => user.rest_id === integration.providerAccountId,
            );

            if (userData) {
                analyticsEntry.followerCount =
                    userData.relationship_counts?.followers || 0;

                const yesterdayFollowerCount =
                    await db.twitterAnalytics.findFirst({
                        where: {
                            integrationId: integration.id,
                        },
                        select: {
                            followerCount: true,
                        },
                        orderBy: {
                            date: 'desc',
                        },
                    });

                if (yesterdayFollowerCount) {
                    analyticsEntry.followerGrowth =
                        analyticsEntry.followerCount -
                        yesterdayFollowerCount.followerCount;
                }

                const tweetsResponse = await fetch(
                    `https://api.apify.com/v2/acts/gentle_cloud~twitter-tweets-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            result_count: '100',
                            since_date: format(
                                subDays(new Date(), 1),
                                'yyyy-MM-dd',
                            ),
                            start_urls: [
                                {
                                    url: `https://twitter.com/${userData.core.screen_name}`,
                                    method: 'GET',
                                },
                            ],
                        }),
                    },
                );

                if (!tweetsResponse.ok) {
                    console.error(
                        'Error fetching Twitter tweets: Failed to fetch tweets data',
                    );
                    return {
                        success: false,
                        message: 'Failed to fetch Twitter tweets data',
                    };
                }

                const tweetsData = await tweetsResponse.json();

                if (Array.isArray(tweetsData) && tweetsData.length > 0) {
                    // Aggregate the analytics data from all tweets
                    let totalFavorites = 0;
                    let totalReplies = 0;
                    let totalRetweets = 0;
                    let totalViews = 0;

                    tweetsData.forEach(
                        (tweet: {
                            favorite_count: number;
                            reply_count: number;
                            retweet_count: number;
                            views_count: string;
                        }) => {
                            totalFavorites += tweet.favorite_count || 0;
                            totalReplies += tweet.reply_count || 0;
                            totalRetweets += tweet.retweet_count || 0;
                            totalViews += parseInt(
                                tweet.views_count || '0',
                                10,
                            );
                        },
                    );

                    const totalEngagements =
                        totalFavorites + totalReplies + totalRetweets;

                    // Update the analytics entry with aggregated data
                    analyticsEntry.favorites = totalFavorites;
                    analyticsEntry.replies = totalReplies;
                    analyticsEntry.retweets = totalRetweets;
                    analyticsEntry.totalEngagements = totalEngagements;
                    analyticsEntry.engagementRate = calculateEngagementRate(
                        totalEngagements,
                        analyticsEntry.followerCount,
                    );
                    analyticsEntry.views = totalViews;
                }
            }
        }

        // Store in database
        await db.twitterAnalytics.create({
            data: analyticsEntry,
        });

        return {
            success: true,
            message: `Successfully fetched analytics for Twitter`,
        };
    } catch (error) {
        console.error('Error fetching Twitter analytics:', error);
        return {
            success: false,
            message: `Failed to fetch analytics for Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

// Helper function to fetch LinkedIn posts and calculate daily analytics
export async function fetchLinkedInAnalytics(
    integration: IntegrationForAnalytics,
): Promise<AnalyticsResult> {
    try {
        if (!integration.access_token || !integration.page_id) {
            throw new Error('No access token or page ID available');
        }

        // Get follower statistics
        const followerResponse = await fetch(
            `https://api.linkedin.com/rest/networkSizes/urn:li:organization:${integration.page_id}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`,
            {
                headers: {
                    Authorization: `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202509',
                },
            },
        );

        let followerCount = 0;
        let followerGrowth = 0;
        if (followerResponse.ok) {
            const followerData = await followerResponse.json();
            followerCount = followerData.firstDegreeSize || 0;

            const yesterdayFollowerCount = await db.linkedinAnalytics.findFirst(
                {
                    where: {
                        integrationId: integration.id,
                    },
                    select: {
                        followerCount: true,
                    },
                    orderBy: {
                        date: 'desc',
                    },
                },
            );

            if (yesterdayFollowerCount) {
                followerGrowth =
                    followerCount - yesterdayFollowerCount.followerCount;
            }
        }

        // Get share statistics (engagement metrics) - using current day
        const today = new Date();
        const startTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        ).getTime();
        const endTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
        ).getTime();

        const shareStatsResponse = await fetch(
            `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${integration.page_id}&timeIntervals.timeRange.start=${startTime}&timeIntervals.timeRange.end=${endTime}&timeIntervals.timeGranularityType=DAY`,
            {
                headers: {
                    Authorization: `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202509',
                },
            },
        );

        let likes = 0;
        let comments = 0;
        let shares = 0;
        let clicks = 0;
        let impressions = 0;
        let engagementRate = 0;

        if (shareStatsResponse.ok) {
            const shareData = await shareStatsResponse.json();
            if (shareData.elements && shareData.elements.length > 0) {
                const stats = shareData.elements[0];
                if (stats.totalShareStatistics) {
                    likes = stats.totalShareStatistics.likeCount || 0;
                    comments = stats.totalShareStatistics.commentCount || 0;
                    shares = stats.totalShareStatistics.shareCount || 0;
                    clicks = stats.totalShareStatistics.clickCount || 0;
                    impressions =
                        stats.totalShareStatistics.impressionCount || 0;
                    engagementRate = stats.totalShareStatistics.engagement || 0;
                }
            }
        }

        // Calculate total engagements
        const totalEngagements = likes + comments + shares + clicks;

        // Create analytics entry for the database
        const analyticsEntry: LinkedInAnalyticsData = {
            date: new Date(),
            followerCount,
            followerGrowth,
            likes,
            comments,
            shares,
            clicks,
            totalEngagements,
            engagementRate,
            impressions,
            integrationId: integration.id,
            userId: integration.userId,
            organizationId: integration.organizationId,
        };

        // Store in database
        await db.linkedinAnalytics.create({
            data: analyticsEntry,
        });

        return {
            success: true,
            message: `Successfully fetched analytics for LinkedIn`,
        };
    } catch (error) {
        console.error('Error fetching LinkedIn analytics:', error);
        return {
            success: false,
            message: `Failed to fetch analytics for LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

// Helper function to fetch Facebook posts and calculate today's analytics only
export async function fetchFacebookAnalytics(
    integration: IntegrationForAnalytics,
): Promise<AnalyticsResult> {
    try {
        if (!integration.access_token) {
            throw new Error('No access token available');
        }

        const pageId = integration.page_id;
        const pageAccessToken = integration.page_access_token;

        let followerCount = 0;
        let followerGrowth = 0;
        let engagementsToday = 0;
        let impressionsToday = 0;
        let reachToday = 0;
        const totalReactions = {
            like: 0,
            love: 0,
            wow: 0,
            haha: 0,
            sorry: 0,
            anger: 0,
        };

        try {
            const permissionsResponse = await fetch(
                `https://graph.facebook.com/v23.0/${pageId}?fields=followers_count&access_token=${pageAccessToken}`,
            );

            const pageInfo = await permissionsResponse.json();
            followerCount = pageInfo.followers_count || 0;

            const yesterdayFollowerCount = await db.facebookAnalytics.findFirst(
                {
                    where: {
                        integrationId: integration.id,
                    },
                    select: {
                        followerCount: true,
                    },
                    orderBy: {
                        date: 'desc',
                    },
                },
            );

            if (yesterdayFollowerCount) {
                followerGrowth =
                    followerCount - yesterdayFollowerCount.followerCount;
            }

            const insightsResponse = await fetch(
                `https://graph.facebook.com/v23.0/${pageId}/insights?metric=page_post_engagements,page_impressions,page_impressions_unique,page_actions_post_reactions_total&period=day&access_token=${pageAccessToken}`,
            );

            const insightsData = await insightsResponse.json();

            if (
                insightsData &&
                insightsData.data &&
                Array.isArray(insightsData.data)
            ) {
                insightsData.data.forEach(
                    (metric: {
                        values: Array<{
                            value?: number | Record<string, number>;
                        }>;
                        name: string;
                    }) => {
                        if (
                            metric.values &&
                            Array.isArray(metric.values) &&
                            metric.values.length > 0
                        ) {
                            const latest =
                                metric.values[metric.values.length - 1];
                            const val = latest?.value || 0;
                            switch (metric.name) {
                                case 'page_post_engagements':
                                    engagementsToday = val as number;
                                    break;
                                case 'page_impressions':
                                    impressionsToday = val as number;
                                    break;
                                case 'page_impressions_unique':
                                    reachToday = val as number;
                                    break;
                                case 'page_actions_post_reactions_total':
                                    // Handle reactions data from page insights
                                    if (
                                        latest?.value &&
                                        typeof latest.value === 'object'
                                    ) {
                                        const reactions = latest.value;
                                        totalReactions.like +=
                                            reactions.like || 0;
                                        totalReactions.love +=
                                            reactions.love || 0;
                                        totalReactions.wow +=
                                            reactions.wow || 0;
                                        totalReactions.haha +=
                                            reactions.haha || 0;
                                        totalReactions.sorry +=
                                            reactions.sorry || 0;
                                        totalReactions.anger +=
                                            reactions.anger || 0;
                                    }
                                    break;
                            }
                        }
                    },
                );
            }
        } catch (error) {
            console.error('Error fetching Facebook page insights:', error);
        }

        const totalEngagements = engagementsToday || 0;
        const analyticsEntry: FacebookAnalyticsData = {
            date: new Date(),
            followerCount,
            followerGrowth,
            reactions: totalReactions,
            totalEngagements: totalEngagements,
            engagementRate: calculateEngagementRate(
                totalEngagements,
                followerCount,
            ),
            reach: reachToday,
            impressions: impressionsToday,
            integrationId: integration.id,
            userId: integration.userId,
            organizationId: integration.organizationId,
        };

        // Store in database
        await db.facebookAnalytics.create({
            data: analyticsEntry,
        });

        return {
            success: true,
            message: `Successfully fetched analytics for Facebook`,
        };
    } catch (error) {
        console.error('Error fetching Facebook analytics:', error);
        return {
            success: false,
            message: `Failed to fetch analytics for Facebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

// Main function to fetch analytics for any integration
export async function fetchAnalyticsForIntegration(
    integration: IntegrationForAnalytics,
): Promise<AnalyticsResult> {
    try {
        switch (integration.provider) {
            case 'twitter':
                return await fetchTwitterAnalytics(integration);
            case 'linkedin':
                return await fetchLinkedInAnalytics(integration);
            case 'facebook':
                return await fetchFacebookAnalytics(integration);
            default:
                return {
                    success: false,
                    message: `Unsupported platform: ${integration.provider}`,
                };
        }
    } catch (error) {
        console.error('Error fetching analytics for integration:', error);
        return {
            success: false,
            message: `Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

// Type for partial integration data needed for analytics
export type IntegrationForAnalytics = Pick<
    Integration,
    | 'id'
    | 'provider'
    | 'providerAccountId'
    | 'access_token'
    | 'page_id'
    | 'page_access_token'
    | 'userId'
    | 'organizationId'
>;
