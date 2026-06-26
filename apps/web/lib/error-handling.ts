/**
 * Error categorization types
 */
export type ErrorCategory =
    | 'network'
    | 'validation'
    | 'server'
    | 'authentication'
    | 'rate-limit'
    | 'unknown';

/**
 * Categorized error information
 */
export interface CategorizedError {
    type: ErrorCategory;
    message: string;
    statusCode: number;
}

/**
 * Categorizes errors for better handling and user messaging
 */
export function categorizeError(error: unknown): CategorizedError {
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
            return {
                type: 'network',
                message:
                    'Network connection issue. Please check your internet connection and try again.',
                statusCode: 503,
            };
        }

        // Rate limiting errors
        if (
            message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('429')
        ) {
            return {
                type: 'rate-limit',
                message:
                    'Too many requests. Please wait a moment and try again.',
                statusCode: 429,
            };
        }

        // Authentication errors
        if (
            message.includes('unauthorized') ||
            message.includes('authentication') ||
            message.includes('401')
        ) {
            return {
                type: 'authentication',
                message: 'Authentication failed. Please try logging in again.',
                statusCode: 401,
            };
        }

        // Validation errors
        if (
            message.includes('validation') ||
            message.includes('invalid') ||
            message.includes('missing') ||
            message.includes('required')
        ) {
            return {
                type: 'validation',
                message:
                    'Invalid request. Please check your input and try again.',
                statusCode: 400,
            };
        }

        // Server errors (500, 502, 503, 504)
        if (
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            message.includes('internal server error')
        ) {
            return {
                type: 'server',
                message: 'Server error. Please try again later.',
                statusCode: 500,
            };
        }
    }

    // Default to unknown error
    return {
        type: 'unknown',
        message: 'An unexpected error occurred. Please try again.',
        statusCode: 500,
    };
}
