import FirecrawlApp from '@mendable/firecrawl-js';

// Initialize FireCrawl client
export const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY || '',
});
