'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { redis, generateCacheKey, CACHE_TTL } from '@/lib/redis';
import { isEmpty } from 'lodash';
import { generateObject } from 'ai';
import { openai as openaiProvider } from '@ai-sdk/openai';
import { z } from 'zod';
import { camelCaseToWords } from '@/lib/utils';
import { formatLinkedInContent } from '@/lib/linkedin-formatter';

export type DataResponse<T> = {
    data: T | null;
    error: string | null;
    isError: boolean;
    isEmpty: boolean;
};

export type FacebookPostType = {
    postId: string;
    createdAt: string;
    mediaType: 'none' | 'image' | 'video' | 'album' | 'link';
    thumbnailUrl: string | null;
    mediaUrl: string[];
    content: string;
    reactions: {
        like: number;
        love: number;
        wow: number;
        haha: number;
        sorry: number;
        anger: number;
    };
    comments: number;
    shares: number;
    impressions: number;
    totalEngagements: number;
    engagementRate: number;
};

export type TwitterPostType = {
    postId: string;
    createdAt: string;
    mediaType: 'none' | 'photo' | 'video';
    mediaUrl: string[];
    content: string;
    favorites: number;
    retweets: number;
    replies: number;
    views: number;
    totalEngagements: number;
    engagementRate: number;
};

export type LinkedInPostType = {
    postId: string;
    createdAt: string;
    mediaType: string | null;
    mediaCount?: number;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    impressions: number;
    totalEngagements: number;
    engagementRate: number;
};

export type PlatformInsight = {
    platform: string;
    growth: string;
    engagement: string;
    bestTime: string[];
    topContent: string[];
    topPosts: TwitterPostType[] | FacebookPostType[] | LinkedInPostType[];
    confidence: number;
    allPosts: TwitterPostType[] | FacebookPostType[] | LinkedInPostType[];
};

function calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return '+0%';

    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

// Helper function to convert date to user's timezone
function formatDateInTimezone(
    date: Date,
    timezone: string,
    format: string = 'yyyy-MM-dd',
): string {
    return formatInTimeZone(date, timezone, format);
}

// Fetch platform insights
export async function fetchPlatformInsights(
    daysRange = 7,
    providerAccountId: string,
    platform?: 'facebook' | 'twitter' | 'linkedin',
): Promise<DataResponse<PlatformInsight>> {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;
        const timezone = user.timeZone;

        // Generate today's date in user's timezone
        const today = formatDateInTimezone(new Date(), timezone);

        // Generate cache key for today's insights
        const cacheKey = generateCacheKey(
            `platform-insights-${platform}`,
            userId,
            user.organizationId!,
            today,
        );

        // Try to get cached insights from Redis
        const cachedInsights = await redis.get<PlatformInsight>(cacheKey);

        // If we have cached insights, return them
        if (cachedInsights) {
            return {
                data: cachedInsights,
                error: null,
                isError: false,
                isEmpty: isEmpty(cachedInsights),
            };
        }

        const fromDate = startOfDay(subDays(new Date(), daysRange));

        // Get analytics - filter by platform if specified
        let analyticsData: any[] = [];

        switch (platform) {
            case 'facebook':
                analyticsData = await db.facebookAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId,
                        date: {
                            gte: fromDate,
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                });

                break;
            case 'twitter':
                analyticsData = await db.twitterAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId,
                        date: {
                            gte: fromDate,
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                });

                break;
            case 'linkedin':
                analyticsData = await db.linkedinAnalytics.findMany({
                    where: {
                        userId,
                        organizationId: user.organizationId,
                        date: {
                            gte: fromDate,
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                });

                break;
            default:
                analyticsData = [];
                break;
        }

        // Check if no data is found
        if (isEmpty(analyticsData)) {
            return {
                data: null,
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        const latestRecord = analyticsData[0];

        // Calculate follower growth
        const oldestRecord = analyticsData[analyticsData.length - 1];
        const followerGrowth = latestRecord.followerGrowth;

        // Calculate engagement change
        const avgEngagement =
            analyticsData.reduce(
                (sum, record) => sum + record.engagementRate,
                0,
            ) / analyticsData.length;
        const previousAvgEngagement = oldestRecord.engagementRate;
        const engagementChange = calculatePercentageChange(
            avgEngagement,
            previousAvgEngagement,
        );

        let aiInsights = null;
        switch (platform) {
            case 'facebook':
                aiInsights = await getFacebookInsight(
                    providerAccountId,
                    daysRange,
                    timezone,
                );
                break;
            case 'twitter':
                aiInsights = await getTwitterInsight(
                    providerAccountId,
                    daysRange,
                    timezone,
                );
                break;
            case 'linkedin':
                aiInsights = await getLinkedinInsight(
                    providerAccountId,
                    daysRange,
                    timezone,
                );
                break;
            default:
                analyticsData = [];
                break;
        }

        const insight: PlatformInsight = {
            platform: platform!,
            growth: `${followerGrowth > 0 ? '+' : ''}${followerGrowth}`,
            engagement: engagementChange,
            bestTime: aiInsights?.bestTime || [],
            topContent: aiInsights?.topContent || [],
            topPosts: aiInsights?.topPosts || [],
            confidence: aiInsights?.confidence || 0,
            allPosts: aiInsights?.allPosts || [],
        };

        // Store insights in Redis cache with TTL (expires at end of day in user's timezone)
        if (!isEmpty(insight)) {
            // Get current time in user's timezone
            const nowInTimezone = toZonedTime(new Date(), timezone);
            // Get end of today in user's timezone
            const endOfTodayInTimezone = endOfDay(nowInTimezone);

            // Calculate TTL in seconds
            const ttl = Math.max(
                60, // Minimum 1 minute
                Math.floor(
                    (endOfTodayInTimezone.getTime() - nowInTimezone.getTime()) /
                        1000,
                ),
            );
            await redis.set(cacheKey, insight, { ex: ttl });
        }

        return {
            data: insight,
            error: null,
            isError: false,
            isEmpty: isEmpty(insight),
        };
    } catch (error) {
        console.error('Error fetching platform insights:', error);
        return {
            data: null,
            error: 'Failed to fetch platform insights',
            isError: true,
            isEmpty: false,
        };
    }
}

type TweetResponseType = {
    id_str: string;
    full_text: string;
    created_at: string;
    favorite_count: number;
    retweet_count: number;
    reply_count: number;
    views_count: string;
    media: {
        type: 'photo' | 'video';
        media_url_https: string;
    }[];
    user: {
        name: string;
    };
};

async function getTwitterInsight(
    providerAccountId: string,
    daysRange: number,
    timezone: string,
) {
    try {
        const twitterUserResponse = await fetch(
            `https://api.apify.com/v2/acts/kaitoeasyapi~premium-twitter-user-scraper-pay-per-result/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_ids: [providerAccountId],
                }),
            },
        );

        if (!twitterUserResponse.ok) {
            console.error(
                'Error fetching Twitter user data: Failed to fetch user data',
            );

            return null;
        }

        const twitterUserData: {
            rest_id: string;
            core: { screen_name: string };
        }[] = await twitterUserResponse.json();

        if (
            twitterUserData &&
            Array.isArray(twitterUserData) &&
            twitterUserData.length > 0
        ) {
            // Find the user whose rest_id matches the providerAccountId
            const userData = twitterUserData.find(
                (user) => user.rest_id === providerAccountId,
            );

            if (userData) {
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
                                subDays(new Date(), daysRange),
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

                    return null;
                }

                const tweetsData: TweetResponseType[] =
                    await tweetsResponse.json();

                const doesNotContainTweets = tweetsData.every(
                    (tweet) => tweet.id_str === '-1',
                );

                if (doesNotContainTweets) {
                    return null;
                }

                // Filter and prepare data for AI agent
                const processedTweets: TwitterPostType[] = tweetsData.map(
                    (tweet) => {
                        const totalEngagements =
                            tweet.favorite_count +
                            tweet.retweet_count +
                            tweet.reply_count;
                        const engagementRate =
                            parseInt(tweet.views_count) > 0
                                ? (totalEngagements /
                                      parseInt(tweet.views_count, 10)) *
                                  100
                                : 0;

                        return {
                            postId: tweet.id_str,
                            content: tweet.full_text,
                            createdAt: formatDateInTimezone(
                                new Date(tweet.created_at),
                                timezone,
                                "MMMM dd 'at' p",
                            ),
                            favorites: tweet.favorite_count || 0,
                            retweets: tweet.retweet_count || 0,
                            replies: tweet.reply_count || 0,
                            views: parseInt(tweet.views_count || '0', 10),
                            mediaType: tweet.media
                                ? tweet.media.some((m) => m.type === 'video')
                                    ? ('video' as const)
                                    : ('photo' as const)
                                : ('none' as const),
                            mediaUrl: tweet.media
                                ? tweet.media.map((m) => m.media_url_https)
                                : [],
                            mediaCount: tweet.media?.length || 0,
                            totalEngagements,
                            engagementRate,
                        };
                    },
                );

                // Get insights from AI agent
                const insights = await generateAiInsights(
                    processedTweets,
                    'twitter',
                );

                return { ...insights, allPosts: processedTweets };
            }
        }
    } catch (error) {
        console.error('Error fetching Twitter insights:', error);
        return null;
    }
}

type FacebookPostResponseType = {
    id: string;
    message?: string;
    created_time: string;
    permalink_url: string;
    insights?: {
        data: Array<{
            name: string;
            period: string;
            values: Array<{
                value: number | Record<string, number>;
            }>;
            title?: string;
            id: string;
        }>;
        paging?: {
            previous?: string;
            next?: string;
        };
    };
    attachments?: {
        data: Array<{
            media_type: 'video' | 'photo' | 'album' | 'link';
            url: string;
            description?: string;
            media?: {
                image?: {
                    height: number;
                    src: string;
                    width: number;
                };
                source?: string;
            };
        }>;
    };
};

async function getFacebookInsight(
    providerAccountId: string,
    daysRange: number,
    timezone: string,
) {
    try {
        // Get the integration to access page access token
        const integration = await db.integration.findFirst({
            where: {
                providerAccountId,
                provider: 'facebook',
            },
        });

        if (!integration || !integration.page_access_token) {
            console.error(
                'Facebook integration or page access token not found',
            );
            return null;
        }

        const pageId = integration.page_id;
        const pageAccessToken = integration.page_access_token;

        // Calculate date range
        const sinceDate = format(subDays(new Date(), daysRange), 'yyyy-MM-dd');
        const untilDate = format(new Date(), 'yyyy-MM-dd');

        // Fetch published posts with insights
        const postsResponse = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/published_posts?fields=id,message,created_time,attachments{media_type,url,description,media},insights.metric(post_reactions_by_type_total,post_media_view,post_activity_by_action_type),permalink_url&since=${sinceDate}&until=${untilDate}&access_token=${pageAccessToken}`,
        );

        if (!postsResponse.ok) {
            console.error(
                'Error fetching Facebook posts:',
                postsResponse.statusText,
            );
            return null;
        }

        const postsData: { data: FacebookPostResponseType[] } =
            await postsResponse.json();

        if (!postsData.data || postsData.data.length === 0) {
            console.log('No Facebook posts found for the date range');
            return null;
        }

        // Process posts data
        const processedPosts: FacebookPostType[] = postsData.data.map(
            (post) => {
                // Extract insights data
                let reactions = {
                    like: 0,
                    love: 0,
                    wow: 0,
                    haha: 0,
                    sorry: 0,
                    anger: 0,
                };
                let comments = 0;
                let shares = 0;
                let impressions = 0;

                if (post.insights?.data) {
                    for (const insight of post.insights.data) {
                        if (
                            insight.name === 'post_reactions_by_type_total' &&
                            insight.values?.[0]
                        ) {
                            // Sum all reaction types
                            const reactionData = insight.values[0].value;
                            if (typeof reactionData === 'object') {
                                reactions.like = reactionData.like || 0;
                                reactions.love = reactionData.love || 0;
                                reactions.wow = reactionData.wow || 0;
                                reactions.haha = reactionData.haha || 0;
                                reactions.sorry = reactionData.sorry || 0;
                                reactions.anger = reactionData.anger || 0;
                            }
                        } else if (
                            insight.name === 'post_media_view' &&
                            insight.values?.[0]
                        ) {
                            impressions =
                                (insight.values[0].value as number) || 0;
                        } else if (
                            insight.name === 'post_activity_by_action_type' &&
                            insight.values?.[0]
                        ) {
                            // Extract comments and shares from activity data
                            const activityData = insight.values[0].value;
                            if (typeof activityData === 'object') {
                                comments = (activityData as any).comment || 0;
                                shares = (activityData as any).share || 0;
                            }
                        }
                    }
                }

                // Extract media information
                let mediaType: 'image' | 'video' | 'none' = 'none';
                let mediaUrl: string[] = [];
                let mediaCount = 0;
                let thumbnailUrl = null;

                if (post.attachments?.data) {
                    for (const attachment of post.attachments.data) {
                        if (attachment.media_type === 'photo') {
                            mediaType = 'image';
                            mediaUrl.push(attachment.url);
                            mediaCount++;
                            thumbnailUrl = attachment.media?.image?.src || null;
                        } else if (attachment.media_type === 'video') {
                            mediaType = 'video';
                            mediaUrl.push(attachment.url);
                            mediaCount++;
                            thumbnailUrl = attachment.media?.image?.src || null;
                        } else if (attachment.media_type === 'album') {
                            mediaType = 'image'; // Treat album as image type
                            mediaUrl.push(attachment.url);
                            mediaCount++;
                            thumbnailUrl = attachment.media?.image?.src || null;
                        } else if (attachment.media_type === 'link') {
                            mediaType = 'none';
                            mediaUrl.push(attachment.url);
                            mediaCount++;
                            thumbnailUrl = null;
                        }
                        // Note: 'link' type doesn't have media, so we keep it as 'none'
                    }
                }
                const totalReactions = Object.values(reactions).reduce(
                    (sum: number, val: number) => sum + val,
                    0,
                );

                return {
                    postId: post.id,
                    content: post.message || '',
                    createdAt: formatDateInTimezone(
                        new Date(post.created_time),
                        timezone,
                        "MMMM dd 'at' p",
                    ),
                    reactions,
                    comments,
                    shares,
                    impressions,
                    mediaType,
                    mediaUrl,
                    mediaCount,
                    thumbnailUrl,
                    totalEngagements: totalReactions + comments + shares,
                    engagementRate:
                        impressions > 0
                            ? ((totalReactions + comments + shares) /
                                  impressions) *
                              100
                            : 0,
                };
            },
        );

        // Get insights from AI agent
        const insights = await generateAiInsights(processedPosts, 'facebook');

        return { ...insights, allPosts: processedPosts };
    } catch (error) {
        console.error('Error fetching Facebook insights:', error);
        return null;
    }
}

type LinkedInPostResponseType = {
    id: string;
    publishedAt: number;
    commentary: string;
    lifecycleState:
        | 'PUBLISHED'
        | 'DRAFT'
        | 'PUBLISH_REQUESTED'
        | 'PUBLISH_FAILED';
    content?:
        | { media: { id: string } }
        | { reference: { id: string } }
        | { multiImage: { images: {}[] } };
    adContext?: {};
};

type LinkedInAnalyticsResponseType = {
    elements: {
        ugcPost?: string;
        share?: string;
        totalShareStatistics: {
            shareCount: number;
            engagement: number;
            clickCount: number;
            likeCount: number;
            impressionCount: number;
            commentCount: number;
        };
    }[];
};

// LinkedIn insight function
async function getLinkedinInsight(
    providerAccountId: string,
    daysRange: number,
    timezone: string,
) {
    try {
        // Get the integration to access access token and page ID
        const integration = await db.integration.findFirst({
            where: {
                providerAccountId,
                provider: 'linkedin',
            },
        });

        if (!integration || !integration.access_token || !integration.page_id) {
            console.error(
                'LinkedIn integration, access token, or page ID not found',
            );
            return null;
        }

        const accessToken = integration.access_token;
        const pageId = integration.page_id;

        const sinceDate = subDays(new Date(), daysRange).getTime();

        // Fetch LinkedIn posts (shares) from the company page
        const postsResponse = await fetch(
            `https://api.linkedin.com/rest/posts?author=urn:li:organization:${pageId}&q=author&start=0&count=100&sortBy=CREATED`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202509',
                },
            },
        );

        if (!postsResponse.ok) {
            console.error(
                'Error fetching LinkedIn posts:',
                postsResponse.statusText,
            );
            return null;
        }

        const postsData: { elements: LinkedInPostResponseType[] } =
            await postsResponse.json();

        // Early return if no posts to analyze
        if (postsData.elements.length === 0) {
            console.log('No LinkedIn posts found for the date range');
            return null;
        }

        const filteredPosts = postsData.elements.filter(
            (post) =>
                post.adContext === undefined &&
                post.lifecycleState === 'PUBLISHED' &&
                post.publishedAt >= sinceDate,
        );

        const shareUrns = filteredPosts
            .filter((post) => post.id && post.id.startsWith('urn:li:share:'))
            .map((post) => encodeURIComponent(post.id))
            .join(',');

        const ugcPostUrns = filteredPosts
            .filter((post) => post.id && post.id.startsWith('urn:li:ugcPost:'))
            .map(
                (post, index) =>
                    `ugcPosts[${index}]=${encodeURIComponent(post.id)}`,
            )
            .join('&');

        // Helper function to create analytics fetch request
        const createAnalyticsRequest = (url: string, requestType: string) =>
            fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202509',
                    ...(requestType === 'share' && {
                        'X-Restli-Protocol-Version': '2.0.0',
                    }),
                },
            }).then(async (response) => {
                if (!response.ok) {
                    throw new Error(
                        `${requestType} analytics request failed: ${response.statusText}`,
                    );
                }
                return response.json();
            });

        // Prepare analytics requests
        const analyticsRequests = [];

        // Add share posts analytics request if there are share URNs
        if (shareUrns) {
            analyticsRequests.push(
                createAnalyticsRequest(
                    `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${pageId}&shares=List(${shareUrns})`,
                    'share',
                ),
            );
        }

        // Add UGC posts analytics request if there are UGC URNs
        if (ugcPostUrns) {
            analyticsRequests.push(
                createAnalyticsRequest(
                    `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${pageId}&${ugcPostUrns}`,
                    'ugc',
                ),
            );
        }

        // Execute analytics requests concurrently with error handling
        // This optimization reduces API call time by making requests in parallel instead of sequentially
        let sharePostsAnalyticsData: LinkedInAnalyticsResponseType | null =
            null;
        let ugcPostsAnalyticsData: LinkedInAnalyticsResponseType | null = null;

        if (analyticsRequests.length > 0) {
            try {
                const analyticsResults = await Promise.all(analyticsRequests);

                // Extract results based on what requests were made
                if (shareUrns && ugcPostUrns) {
                    // Both requests were made
                    sharePostsAnalyticsData = analyticsResults[0];
                    ugcPostsAnalyticsData = analyticsResults[1];
                } else if (shareUrns) {
                    // Only share request was made
                    sharePostsAnalyticsData = analyticsResults[0];
                } else if (ugcPostUrns) {
                    // Only UGC request was made
                    ugcPostsAnalyticsData = analyticsResults[0];
                }
            } catch (error) {
                console.error('Error fetching LinkedIn analytics:', error);
                // Continue execution with null data rather than failing completely
            }
        }

        // Process posts data and attach analytics
        const processedPosts: LinkedInPostType[] = filteredPosts.map((post) => {
            // Extract post content and format it
            let content = formatLinkedInContent(post.commentary || '');
            let mediaType: string | null = null;
            let mediaCount: number | undefined;

            // Check for media attachments
            if (post.content) {
                if ('media' in post.content || 'reference' in post.content) {
                    const mediaId = Object.values(post.content)[0].id;
                    const mediaTypeFromId = mediaId.split(':')[2];
                    mediaType = camelCaseToWords(mediaTypeFromId, ['LinkedIn']);
                } else if ('multiImage' in post.content) {
                    mediaType = 'Multiple Images';
                    mediaCount = post.content.multiImage.images.length;
                } else {
                    const mediaTypeFromKey = Object.keys(post.content)[0];
                    mediaType = camelCaseToWords(mediaTypeFromKey, [
                        'LinkedIn',
                    ]);
                }
            }

            // Find analytics data for this post
            let analytics = null;

            if (
                post.id.startsWith('urn:li:share:') &&
                sharePostsAnalyticsData
            ) {
                // Find analytics for share posts
                analytics = sharePostsAnalyticsData.elements.find(
                    (element) => element.share === post.id,
                );
            } else if (
                post.id.startsWith('urn:li:ugcPost:') &&
                ugcPostsAnalyticsData
            ) {
                // Find analytics for UGC posts
                analytics = ugcPostsAnalyticsData.elements.find(
                    (element) => element.ugcPost === post.id,
                );
            }

            // Extract analytics data
            let likes = 0;
            let comments = 0;
            let shares = 0;
            let clicks = 0;
            let impressions = 0;
            let engagementRate = 0;

            if (analytics && analytics.totalShareStatistics) {
                likes = analytics.totalShareStatistics.likeCount || 0;
                comments = analytics.totalShareStatistics.commentCount || 0;
                shares = analytics.totalShareStatistics.shareCount || 0;
                clicks = analytics.totalShareStatistics.clickCount || 0;
                impressions =
                    analytics.totalShareStatistics.impressionCount || 0;
                engagementRate = analytics.totalShareStatistics.engagement || 0;
            }

            const totalEngagements = likes + comments + shares + clicks;

            return {
                postId: post.id,
                content,
                createdAt: formatDateInTimezone(
                    new Date(post.publishedAt),
                    timezone,
                    "MMMM dd 'at' p",
                ),
                likes,
                comments,
                shares,
                clicks,
                impressions,
                mediaType,
                mediaCount,
                totalEngagements,
                engagementRate,
            };
        });

        // Get insights from AI agent
        const insights = await generateAiInsights(processedPosts, 'linkedin');

        return { ...insights, allPosts: processedPosts };
    } catch (error) {
        console.error('Error fetching LinkedIn insights:', error);
        return null;
    }
}

// AI Agent function to generate LinkedIn insights
async function generateAiInsights(
    posts: LinkedInPostType[] | FacebookPostType[] | TwitterPostType[],
    platform: 'facebook' | 'linkedin' | 'twitter',
) {
    const platformSpecificMetrics = {
        facebook: `
        - Content themes (news, personal, promotional, educational, etc.)
        - Content formats (questions, statements, calls-to-action, etc.)
        - Media usage patterns (images, videos, text-only)
        - Content length patterns`,
        linkedin: `
        - Content themes (professional updates, industry news, thought leadership, company updates, etc.)
        - Content formats (questions, statements, calls-to-action, etc.)
        - Media usage patterns (images, videos, articles, text-only)
        - Content length patterns
        - Professional vs. personal tone`,
        twitter: `
        - Content themes (news, personal, promotional, educational, etc.)
        - Content formats (questions, statements, calls-to-action, etc.)
        - Media usage patterns (images, videos, text-only)
        - Content length patterns`,
    };
    const platformSpecificGoals = {
        facebook: `Focus on actionable insights that can help improve Facebook performance for professional networking and B2B engagement.`,
        linkedin: `Focus on actionable insights that can help improve LinkedIn performance for professional networking and B2B engagement.`,
        twitter: `Focus on actionable insights that can help improve Twitter performance for professional networking and B2B engagement.`,
    };

    const formattedPlatform =
        platform.charAt(0).toUpperCase() + platform.slice(1);

    try {
        const { object: result } = await generateObject({
            model: openaiProvider('gpt-4o-mini'),
            schema: z.object({
                bestTime: z
                    .array(z.string())
                    .describe(
                        "Array of best posting times in format 'HH:MM AM/PM'",
                    ),
                topContent: z
                    .array(z.string())
                    .describe(
                        'Array of top performing content types/categories',
                    ),
                topPosts: z
                    .array(z.string().describe('post_id'))
                    .describe('Array of top performing posts post_id'),
                confidence: z
                    .number()
                    .describe('Confidence level of the insights'),
            }),
            prompt: `Analyze the following ${formattedPlatform} posts data and provide insights about best posting times, top content types, and top performing posts.

${formattedPlatform} Posts Data:
${JSON.stringify(posts, null, 2)}

Please analyze this data and provide:

1. **Best Times**: Identify the 2-3 best posting times based on engagement patterns. Look at when posts with high engagement were posted and extract the time patterns. Format as "HH:MM AM/PM" to the nearest 30 minutes.

2. **Top Content**: Categorize the content that perform best based on engagement rates. Look for patterns in:
   ${platformSpecificMetrics[platform]}

3. **Top Posts**: Select the top 3 posts with the highest engagement rates and provide their postIds.

4. **Confidence**: Provide a confidence level between 0 and 100 for the insights.

${platformSpecificGoals[platform]}`,
        });

        const topPosts = posts
            .filter((post) => result.topPosts.includes(post.postId))
            .sort((a, b) => b.engagementRate - a.engagementRate);

        return {
            ...result,
            topPosts: topPosts as
                | TwitterPostType[]
                | FacebookPostType[]
                | LinkedInPostType[],
        };
    } catch (error) {
        console.error('Error generating LinkedIn insights:', error);
        return null;
    }
}
