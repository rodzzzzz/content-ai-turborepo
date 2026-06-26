import { z } from 'zod';

export const crawlRequestSchema = z.object({
    url: z.string().url(),
    mode: z.enum(['exact', 'path', 'domain']),
});

export const extractRequestSchema = z.object({
    urls: z.array(z.string().url()),
});

export type CrawlResult = {
    title: string;
    url: string;
};

export type ExtractedLink = {
    id: string;
    title: string;
    url: string;
    content: string;
    refreshedAt: string | null;
};

export type ExtractResult = {
    url: string;
    success: boolean;
    data?: ExtractedLink;
    error?: string;
};

export type CachedCrawlData = {
    url: string;
    mode: string;
    crawledUrls: CrawlResult[];
};
