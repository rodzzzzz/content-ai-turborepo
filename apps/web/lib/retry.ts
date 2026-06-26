/**
 * Retry configuration for operations
 */
export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network-related errors
        if (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('econnreset') ||
            message.includes('enotfound') ||
            message.includes('econnrefused')
        ) {
            return true;
        }

        // Rate limiting errors
        if (
            message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('429')
        ) {
            return true;
        }

        // Temporary server errors
        if (
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
        ) {
            return true;
        }

        // API-specific retryable errors
        if (
            message.includes('service unavailable') ||
            message.includes('temporary') ||
            message.includes('retry')
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    operationName: string = 'operation',
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            console.log(
                `${operationName}: Attempt ${attempt}/${config.maxAttempts}`,
            );
            const result = await operation();

            if (attempt > 1) {
                console.log(
                    `${operationName}: Succeeded on attempt ${attempt}`,
                );
            }

            return result;
        } catch (error) {
            lastError = error;

            // Don't retry on the last attempt
            if (attempt === config.maxAttempts) {
                console.error(
                    `${operationName}: Failed after ${config.maxAttempts} attempts`,
                );
                break;
            }

            // Check if error is retryable
            if (!isRetryableError(error)) {
                console.error(
                    `${operationName}: Non-retryable error encountered:`,
                    error,
                );
                break;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                config.baseDelayMs *
                    Math.pow(config.backoffMultiplier, attempt - 1),
                config.maxDelayMs,
            );

            console.warn(
                `${operationName}: Attempt ${attempt} failed, retrying in ${delay}ms:`,
                error,
            );
            await sleep(delay);
        }
    }

    throw lastError;
}
