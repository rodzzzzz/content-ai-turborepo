import { Index } from '@upstash/vector';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { trackAICost } from '@/actions/usage';

// Initialize Upstash Vector client
const vectorIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

/**
 * Generate embedding for a text string using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        if (text === '') {
            return [];
        }

        const { embedding, usage } = await embed({
            model: openai.textEmbeddingModel('text-embedding-ada-002'),
            value: text,
        });

        try {
            await trackAICost(
                {
                    tokens: usage.tokens,
                },
                'embedding',
                {
                    modelUsage: usage,
                },
            );
        } catch (error) {
            console.error('Embedding Feature: Error tracking AI cost:', error, {
                usage,
            });
        }

        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Fetch vector metadatas by namespace
 */
export async function fetchVectorMetadatasByNamespace(
    namespace: string,
    vectorIds: string[],
) {
    try {
        const results = await vectorIndex.fetch(vectorIds, {
            includeVectors: false,
            includeMetadata: true,
            namespace,
        });

        return results;
    } catch (error) {
        console.error('Error fetching vectors by namespace:', error);
        throw new Error('Failed to fetch vectors by namespace');
    }
}

/**
 * Store a vector in Upstash Vector
 */
export async function storeVector(
    knowledgeBaseId: string,
    vectorId: string,
    vector: number[],
    metadata: Record<string, unknown>,
): Promise<string> {
    try {
        await vectorIndex.upsert(
            [
                {
                    id: vectorId,
                    vector,
                    metadata,
                },
            ],
            { namespace: knowledgeBaseId },
        );

        return vectorId;
    } catch (error) {
        console.error('Error storing vector:', error);
        throw new Error('Failed to store vector in Upstash');
    }
}

/**
 * Search for similar vectors in Upstash Vector
 */
export async function searchVectors(
    knowledgeBaseId: string,
    vector: number[],
    options?: {
        filter?: string;
        limit?: number;
    },
): Promise<
    Array<{ id: string; score: number; metadata: Record<string, unknown> }>
> {
    try {
        const results = await vectorIndex.query(
            {
                vector,
                topK: options?.limit || 10,
                filter: options?.filter,
                includeMetadata: true,
            },
            { namespace: knowledgeBaseId },
        );

        return results.map((item) => ({
            id: String(item.id),
            score: item.score,
            metadata: item.metadata || {},
        }));
    } catch (error) {
        console.error('Error searching vectors:', error);
        throw new Error('Failed to search vectors in Upstash');
    }
}

/**
 * Update a vector in Upstash Vector
 */
export async function updateVector(
    namespace: string,
    id: string,
    vector: number[],
    metadata: Record<string, unknown>,
): Promise<void> {
    try {
        await vectorIndex.upsert(
            [
                {
                    id,
                    vector,
                    metadata,
                },
            ],
            { namespace },
        );
    } catch (error) {
        console.error('Error updating vector:', error);
        throw new Error('Failed to update vector in Upstash');
    }
}

/**
 * Delete a vector from Upstash Vector
 */
export async function deleteVector(
    knowledgeBaseId: string,
    id: string,
): Promise<void> {
    try {
        await vectorIndex.delete(id, { namespace: knowledgeBaseId });
    } catch (error) {
        console.error('Error deleting vector:', error);
        throw new Error('Failed to delete vector from Upstash');
    }
}

/**
 * Delete a namespace from Upstash Vector
 */
export async function deleteVectorNamespace(
    knowledgeBaseId: string,
): Promise<void> {
    try {
        await vectorIndex.deleteNamespace(knowledgeBaseId);
    } catch (error) {
        console.error('Error deleting namespace:', error);
        throw new Error('Failed to delete namespace from Upstash');
    }
}
