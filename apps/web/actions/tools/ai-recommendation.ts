'use server';

import { endOfDay, format } from 'date-fns';
import { currentUser } from '@/lib/auth';
import { redis, generateCacheKey } from '@/lib/redis';
import { fetchPlatformInsights, type PlatformInsight } from './insight';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export type DataResponse<T> = {
    data: T | null;
    error: string | null;
    isError: boolean;
    isEmpty: boolean;
};

// Types for recommendations
export type AIRecommendation = {
    title: string;
    description: string;
    iconType: string; // We'll use this to determine which icon to show
    priorityLevel: string;
};

// Type for OpenAI recommendation
type Recommendation = {
    title: string;
    description: string;
    iconType: string;
    priorityLevel: string;
};

// Type for OpenAI response
type OpenAIRecommendationResponse = {
    recommendations: Recommendation[] | Recommendation;
};

type IntegratedPlatform = {
    id: string;
    provider: string;
    account_name: string | null;
    account_type: string | null;
    page_name: string | null;
    providerAccountId: string;
};

// Fetch recommendations
export async function fetchAIRecommendations(
    integratedPlatforms: IntegratedPlatform[],
    daysRange = 7,
): Promise<DataResponse<AIRecommendation[]>> {
    try {
        const user = await currentUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const userId = user.id;

        if (integratedPlatforms.length === 0) {
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Generate today's date in YYYY-MM-DD format
        const today = format(new Date(), 'yyyy-MM-dd');

        // Generate cache key for today's recommendations
        const cacheKey = generateCacheKey(
            'ai-recommendations',
            userId,
            user.organizationId!,
            today,
        );

        // Try to get cached recommendations from Redis
        let cachedRecommendations: AIRecommendation[] | null = null;
        try {
            cachedRecommendations =
                await redis.get<AIRecommendation[]>(cacheKey);
        } catch (cacheError) {
            console.error(
                'Error retrieving cached recommendations:',
                cacheError,
            );
            // Continue without cache if retrieval fails
        }

        // If we have cached recommendations, return them
        if (
            cachedRecommendations &&
            Array.isArray(cachedRecommendations) &&
            cachedRecommendations.length > 0
        ) {
            return {
                data: cachedRecommendations,
                error: null,
                isError: false,
                isEmpty: false,
            };
        }

        // Get insights for all integrated platforms
        const platformInsights: PlatformInsight[] = [];
        const insightsPromises = integratedPlatforms.map(async (platform) => {
            try {
                const insight = await fetchPlatformInsights(
                    daysRange,
                    platform.providerAccountId,
                    platform.provider as 'facebook' | 'twitter' | 'linkedin',
                );
                if (insight.data && !insight.isEmpty) {
                    return insight.data;
                }
                return null;
            } catch (error) {
                console.error(
                    `Error fetching insights for ${platform.provider}:`,
                    error,
                );
                return null;
            }
        });

        const insightsResults = await Promise.all(insightsPromises);
        const validInsights = insightsResults.filter(
            (insight): insight is PlatformInsight => insight !== null,
        );
        platformInsights.push(...validInsights);

        // If no insights are available, return early with a helpful message
        if (platformInsights.length === 0) {
            console.log(
                'No platform insights available for recommendations generation',
            );
            return {
                data: [],
                error: null,
                isError: false,
                isEmpty: true,
            };
        }

        // Generate AI recommendations using OpenAI
        const prompt = `
        As a social media expert, analyze the following analytics data for the past ${daysRange} days and generate between 5-10 highly specific, actionable recommendations to improve social media performance. Do not exceed 10 recommendations.

        PLATFORM INSIGHTS DATA:
        ${JSON.stringify(platformInsights, null, 2)}

        ANALYSIS INSTRUCTIONS:
        - Examine the growth metrics, engagement rates, and confidence levels for each platform
        - Look at the bestTime data to identify optimal posting schedules
        - Analyze topContent patterns to understand what content types perform best
        - Review topPosts to identify successful content characteristics
        - Consider the confidence levels when making recommendations (higher confidence = more reliable insights)
        - Identify platforms with lower engagement rates or negative growth trends

        GUIDELINES FOR RECOMMENDATIONS:
        - Focus on data-driven insights and specific actionable advice based on the actual performance data provided
        - Include platform-specific recommendations where relevant, referencing specific platforms from the data
        - Cover different strategic areas: content strategy, posting times, engagement tactics, audience growth, and platform optimization
        - Prioritize recommendations that address areas showing negative trends or underperformance
        - Be specific about what actions to take and what results to expect
        - Reference specific metrics, trends, and patterns from the provided data
        - Consider the confidence levels and data quality when making recommendations
        
        RECOMMENDATION CATEGORIES TO INCLUDE:
        - Content optimization: What specific content types perform best on each platform based on the topPosts data
        - Posting schedule: When to post for maximum engagement based on the bestTime data from insights
        - Engagement tactics: How to increase interaction based on engagement rates and patterns observed
        - Growth strategies: Specific approaches to grow audience based on growth metrics and follower trends
        - Platform-specific tactics: Leveraging unique features of each platform represented in the data
        - Performance improvement: Address specific areas where engagement rates or growth are below expectations
        
        RESPONSE FORMAT:
        Each recommendation must include:
        1. Title: A clear, concise 3-5 word title that captures the key point
        2. Description: A specific, actionable recommendation (60-100 characters) that the user can implement immediately
        3. IconType: Must be one of: "twitter", "facebook", "instagram", "linkedin", "calendar", "info"
           - Use platform icons (twitter, facebook, instagram, linkedin) for platform-specific recommendations
           - Use "calendar" for timing/scheduling recommendations
           - Use "info" for general strategy recommendations
        4. PriorityLevel: Must be one of: "low", "medium", "high"
           - Use "low" for recommendations that are not critical
           - Use "medium" for recommendations that are important
           - Use "high" for recommendations that are critical
        
        Generate at least 5 and no more than 10 diverse recommendations that directly address the challenges and opportunities in the data.
        `;

        let result: OpenAIRecommendationResponse;
        try {
            const { object } = await generateObject({
                model: openai('gpt-4o-mini'),
                schema: z.object({
                    recommendations: z
                        .array(
                            z.object({
                                title: z
                                    .string()
                                    .describe(
                                        'Title of the recommendation (3-50 characters)',
                                    ),
                                description: z
                                    .string()
                                    .describe(
                                        'Description of the recommendation (20-200 characters)',
                                    ),
                                iconType: z
                                    .string()
                                    .describe(
                                        'Icon type of the recommendation',
                                    ),
                                priorityLevel: z.enum([
                                    'low',
                                    'medium',
                                    'high',
                                ]),
                            }),
                        )
                        .describe('Array of 5-10 recommendations'),
                }),
                system: 'You are an elite social media strategist who analyzes performance data to provide targeted, high-impact recommendations. Your advice is specific, actionable, and based directly on the data patterns you identify. Your recommendations help clients achieve measurable improvements in engagement, growth, and content performance. Format your response as a JSON object according to the specified structure.',
                prompt,
            });
            result = object;
        } catch (aiError) {
            console.error('Error generating AI recommendations:', aiError);
            return {
                data: null,
                error: 'Failed to generate AI recommendations',
                isError: true,
                isEmpty: false,
            };
        }

        // Validate that we have recommendations
        if (!result || !result.recommendations) {
            console.error('No recommendations received from AI');
            return {
                data: null,
                error: 'No recommendations generated',
                isError: true,
                isEmpty: false,
            };
        }

        // Normalize recommendations to always be an array
        const recommendationsData = Array.isArray(result.recommendations)
            ? result.recommendations
            : [result.recommendations];

        // Valid icon types
        const validIconTypes = [
            'twitter',
            'facebook',
            'instagram',
            'linkedin',
            'calendar',
            'info',
        ];

        // Validate recommendations and ensure they have required properties
        const recommendations: AIRecommendation[] = recommendationsData
            .filter(
                (rec) => rec && rec.title && rec.description && rec.iconType,
            )
            .map((rec) => ({
                title: rec.title,
                description: rec.description,
                // Ensure iconType is one of the supported values, default to 'info' if not
                iconType: validIconTypes.includes(rec.iconType.toLowerCase())
                    ? rec.iconType.toLowerCase()
                    : 'info',
                priorityLevel: rec.priorityLevel,
            }));

        // Store recommendations in Redis cache with TTL (expires at end of day)
        if (recommendations.length > 0) {
            try {
                const endOfTodayInSeconds = Math.floor(
                    (endOfDay(new Date()).getTime() - new Date().getTime()) /
                        1000,
                );
                const ttl = Math.max(60, endOfTodayInSeconds); // At least 1 minute, or until end of day
                await redis.set(cacheKey, recommendations, { ex: ttl });
            } catch (cacheError) {
                console.error('Error caching recommendations:', cacheError);
                // Don't fail the entire operation if caching fails
            }
        }

        return {
            data: recommendations,
            error: null,
            isError: false,
            isEmpty: recommendations.length === 0,
        };
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return {
            data: null,
            error: 'Failed to generate recommendations',
            isError: true,
            isEmpty: false,
        };
    }
}
