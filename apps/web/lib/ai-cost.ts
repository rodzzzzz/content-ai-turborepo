import { db } from './db';

export type AIFeature =
    | 'campaign-agent'
    | 'campaign-tool'
    | 'content-generation'
    | 'image-generation'
    | 'research-agent'
    | 'embedding'
    | 'youtube-scraper'
    | 'twitter-scraper';

export type AIUsageType =
    | 'input'
    | 'output'
    | 'web-search'
    | 'embedding'
    | 'result';

export interface AICostParams {
    feature: AIFeature;
    usageType: AIUsageType;
    quantity: number; // token count, or number of searches, etc.
}

/**
 * Computes cost in USD using DB-configured rates.
 * Throws for unsupported or missing rates.
 */
export async function calculateAICost({
    feature,
    usageType,
    quantity,
}: AICostParams): Promise<number> {
    // Look for an exact match (feature+usageType)
    const pricing = await db.aIPricing.findFirst({
        where: {
            feature,
            usageType,
        },
        orderBy: [
            { model: 'desc' }, // Prefer matches WITH a model if given
        ],
    });
    if (!pricing) {
        throw new Error(
            `No pricing found for feature=${feature}, usageType=${usageType}`,
        );
    }
    if (!pricing.unitAmount || !pricing.unitPrice) {
        throw new Error('Pricing entry missing unitAmount or unitPrice');
    }
    if (quantity <= 0) return 0;
    // Price is in cents per unitAmount (eg. 1,000,000 tokens)
    const numUnits = quantity / pricing.unitAmount;
    const totalCents = Math.ceil(numUnits * pricing.unitPrice);
    // Convert cents to USD float, rounded to 4 decimals for safety.
    return Math.round(totalCents) / 100;
}
