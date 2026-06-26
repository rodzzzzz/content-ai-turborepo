import { Redis } from '@upstash/redis';

// Initialize Redis client with configuration from environment variables
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Set how long the cache will be valid (default: 24 hours in seconds)
export const CACHE_TTL = 86400;

// Helper function to generate cache keys
export function generateCacheKey(
    prefix: string,
    userId: string | undefined,
    organizationId: string | undefined,
    date: string,
): string {
    return `${prefix}:${userId || 'anonymous'}:${organizationId || 'anonymous'}:${date}`;
}
