import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Chunks text into smaller pieces while preserving sentence boundaries
 * @param text The text to chunk
 * @param maxChunkSize Maximum size of each chunk (default: 4000 characters)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    // Split by sentences to maintain context
    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Summarizes a single piece of text using AI
 * @param text The text to summarize
 * @returns A concise summary
 */
export async function summarizeText(text: string): Promise<string> {
    const { text: summary } = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are a helpful assistant that summarizes text. Your task is to create a concise summary that captures the main points and key information. Keep the summary under 200 words.`,
        prompt: text,
    });

    return summary;
}

/**
 * Summarizes long text by chunking and combining summaries
 * @param text The long text to summarize
 * @returns A concise summary of the entire text
 */
export async function summarizeLongText(text: string): Promise<string> {
    const chunks = chunkText(text);
    const summaries = await Promise.all(
        chunks.map((chunk) => summarizeText(chunk)),
    );

    // If we have multiple summaries, combine them into a final summary
    if (summaries.length > 1) {
        return await summarizeText(summaries.join('\n\n'));
    }

    return summaries[0];
}
