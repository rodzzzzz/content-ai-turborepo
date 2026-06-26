'use server';

import { currentUser } from '@/lib/auth';

import { firecrawl } from '@/lib/firecrawl';
import urlMetadata from 'url-metadata';
import { redis } from '@/lib/redis';
import {
    fetchVectorMetadatasByNamespace,
    generateEmbedding,
    storeVector,
    deleteVector,
    updateVector,
} from '@/lib/vector-client';
import { db } from '@/lib/db';
import { isEmpty } from 'lodash';
import {
    crawlRequestSchema,
    ExtractResult,
    ExtractedLink,
    extractRequestSchema,
    CachedCrawlData,
} from '@/lib/validations/website-extraction';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { DEFAULT_PERSONALITY } from '@/constants/prompt';

const getMetadataTitle = async (url: string) => {
    try {
        const metadata = await urlMetadata(url);
        return metadata.title;
    } catch (err) {
        return '';
    }
};

export async function crawlWebsite(
    url: string,
    mode: 'exact' | 'path' | 'domain',
) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Validate input
        const { url: validatedUrl, mode: validatedMode } =
            crawlRequestSchema.parse({
                url,
                mode,
            });

        if (validatedMode === 'exact') {
            const title = await getMetadataTitle(validatedUrl);
            const result = [{ title, url: validatedUrl }];

            return { success: true, data: result };
        }

        // Use the FireCrawl client to map the website URLs
        const response = await firecrawl.map(validatedUrl);

        if (!response.links) {
            throw new Error('No links found');
        }

        // Filter and transform results based on mode
        const results = response.links
            .filter((urlData) => {
                if (mode === 'path') {
                    try {
                        const linkUrl = new URL(urlData.url);
                        const urlPath = new URL(validatedUrl).pathname;
                        return linkUrl.pathname.startsWith(urlPath);
                    } catch {
                        return false;
                    }
                }
                return true; // For domain mode, return all results
            })
            .map(async (url) => {
                const title = await getMetadataTitle(url.url);
                return { title, url: url.url };
            });

        const finalResults = await Promise.all(results);

        const cacheKey = `crawl:${user.id}:${user.organizationId}`;

        // Cache the results for 24 hours
        await redis.set(
            cacheKey,
            {
                url: validatedUrl,
                mode: validatedMode,
                crawledUrls: finalResults,
            },
            { ex: 24 * 60 * 60 }, // 24 hours in seconds
        );

        return { success: true, data: finalResults };
    } catch (error) {
        console.error('[CRAWL_ERROR]', error);
        throw error;
    }
}

export async function deleteCachedCrawlData() {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        await redis.del(`crawl:${user.id}:${user.organizationId}`);

        return { success: true };
    } catch (error) {
        console.error('[DELETE_CACHED_CRAWL_DATA_ERROR]', error);
        throw error;
    }
}

export async function extractContent(urls: string[]): Promise<ExtractResult[]> {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Validate input
        const { urls: validatedUrls } = extractRequestSchema.parse({ urls });

        // Extract content from each URL
        const results = await Promise.all(
            validatedUrls.map(async (url) => {
                try {
                    const data = await firecrawl.scrape(url, {
                        formats: [
                            {
                                type: 'summary',
                            },
                        ],
                    });

                    // Generate embedding for the content
                    const embedding = await generateEmbedding(
                        data.summary || '',
                    );

                    const dateNow = new Date().toISOString();

                    // Create a unique vector ID
                    const vectorId = crypto.randomUUID();

                    // Store the vector with metadata
                    await storeVector(
                        `website-extraction:${user.id!}:${user.organizationId!}`,
                        vectorId,
                        embedding,
                        {
                            title: data.metadata?.title || '',
                            url: data.metadata?.url || '',
                            content: data.summary || '',
                            userId: user.id!,
                            id: vectorId,
                            refreshedAt: dateNow,
                        },
                    );

                    return {
                        url,
                        success: true,
                        data: {
                            title: data.metadata?.title || '',
                            url: url,
                            content: data.summary || '',
                            id: vectorId,
                            refreshedAt: dateNow,
                        },
                    };
                } catch (error) {
                    console.error(`Error extracting from ${url}:`, error);
                    return {
                        url,
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                    };
                }
            }),
        );

        const vectorIds = results
            .map((result) => result.data?.id)
            .filter((id): id is string => id !== undefined);

        await db.personality.upsert({
            where: {
                userId: user.id!,
                organizationId: user.organizationId!,
            },
            create: {
                userId: user.id!,
                organizationId: user.organizationId!,
                vectorIds,
            },
            update: {
                vectorIds: {
                    push: vectorIds,
                },
            },
        });

        return results;
    } catch (error) {
        console.error('[EXTRACT_ERROR]', error);
        throw error;
    }
}

export async function getCachedCrawlData(): Promise<CachedCrawlData | null> {
    try {
        const user = await currentUser();
        if (!user) {
            return null;
        }

        // Get all keys matching the pattern
        const cachedData = await redis.get<CachedCrawlData>(
            `crawl:${user.id}:${user.organizationId!}`,
        );

        if (!cachedData) {
            return null;
        }

        return cachedData;
    } catch (error) {
        console.error('[CACHE_FETCH_ERROR]', error);
        return null;
    }
}

export async function getPageExtractionVector(): Promise<ExtractedLink[]> {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        const vectorIds = await db.personality.findUnique({
            where: {
                userId: user.id!,
                organizationId: user.organizationId!,
            },
            select: {
                vectorIds: true,
            },
        });

        if (!vectorIds || isEmpty(vectorIds.vectorIds)) {
            return [];
        }

        const vectorMetadatas = await fetchVectorMetadatasByNamespace(
            `website-extraction:${user.id!}:${user.organizationId!}`,
            vectorIds.vectorIds,
        );

        const pageExtractionData = vectorMetadatas.map((metadata) => ({
            title: metadata?.metadata?.title || '',
            url: metadata?.metadata?.url || '',
            content: metadata?.metadata?.content || '',
            id: metadata?.metadata?.id || '',
            refreshedAt: metadata?.metadata?.refreshedAt,
        })) as ExtractedLink[];

        const sortedPageExtractionData = pageExtractionData.sort(
            (a, b) =>
                new Date(b.refreshedAt!).getTime() -
                new Date(a.refreshedAt!).getTime(),
        );

        return sortedPageExtractionData;
    } catch (error) {
        console.error('[GET_WEBSITE_EXTRACTION_VECTOR_ERROR]', error);
        throw error;
    }
}

export async function deleteExtractedLink(linkIds: string[]) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Delete the vector from Upstash
        await Promise.all(
            linkIds.map((linkId) =>
                deleteVector(
                    `website-extraction:${user.id!}:${user.organizationId!}`,
                    linkId,
                ),
            ),
        );

        // Update the Personality model to remove the vectorId
        const personality = await db.personality.findUnique({
            where: {
                userId: user.id!,
                organizationId: user.organizationId!,
            },
            select: {
                vectorIds: true,
            },
        });

        if (personality) {
            await db.personality.update({
                where: {
                    userId: user.id!,
                    organizationId: user.organizationId!,
                },
                data: {
                    vectorIds: {
                        set: personality.vectorIds.filter(
                            (id) => !linkIds.includes(id),
                        ),
                    },
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('[DELETE_EXTRACTED_LINK_ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function updateExtractedContent(
    linkId: string,
    title: string,
    content: string,
    url: string,
) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Generate new embedding for the updated content
        const embedding = await generateEmbedding(content);

        const refreshedAt = new Date().toISOString();

        // Update the vector in Upstash
        await updateVector(
            `website-extraction:${user.id!}:${user.organizationId!}`,
            linkId,
            embedding,
            {
                content,
                title,
                url,
                userId: user.id!,
                id: linkId,
                refreshedAt,
            },
        );

        return { success: true, refreshedAt };
    } catch (error) {
        console.error('[UPDATE_EXTRACTED_CONTENT_ERROR]', error);
        throw error;
    }
}

export async function extractPersonalityFromWebsite(url: string) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Validate URL
        const { urls: validatedUrls } = extractRequestSchema.parse({
            urls: [url],
        });
        const validatedUrl = validatedUrls[0];

        // Scrape the website using FireCrawl
        const scrapedData = await firecrawl.scrape(validatedUrl, {
            formats: [
                {
                    type: 'markdown',
                },
            ],
        });

        const websiteContent = scrapedData.markdown || '';

        if (!websiteContent) {
            throw new Error('No content found on the website');
        }

        // Use AI to extract personality matching DEFAULT_PERSONALITY structure
        const { text: extractedPersonality } = await generateText({
            model: openai('gpt-5-nano'),
            system: `You are an expert at analyzing brand voice and personality from website content. Your task is to extract personality information that matches a specific structure.`,
            prompt: `Analyze the following website content and extract personality information that matches the structure below.

WEBSITE CONTENT:
${websiteContent}

TARGET STRUCTURE (use this exact format):
${DEFAULT_PERSONALITY}

INSTRUCTIONS:
- Extract personality information from the website content that matches the structure above
- Focus on Brand Voice: Analyze the tone, language style, communication approach, and voice characteristics evident in the website
- Focus on Content Creation Approach: Identify how the brand creates content, what they prioritize, their content strategy patterns
- Focus on Content Guidelines: Extract any content guidelines, values, principles, or standards mentioned or implied
- Match the exact format with numbered sections (1., 2., 3.) and bullet points using "-"
- Start with "YOUR PERSONALITY IS:" followed by a blank line
- Be specific and detailed based on what you find in the website content
- If certain aspects aren't evident in the content, infer reasonable defaults based on the brand's overall tone and style
- Ensure the output matches the structure and formatting of the target structure exactly

Output only the personality text in the exact format specified, starting with "YOUR PERSONALITY IS:".`,
        });

        return {
            success: true,
            data: extractedPersonality,
        };
    } catch (error) {
        console.error('[EXTRACT_PERSONALITY_ERROR]', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to extract personality from website',
        };
    }
}
