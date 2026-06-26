import { z } from 'zod';
import { postContentSchema } from './campaign';

/**
 * Operation to add one or more new posts to a platform
 */
export const addPostOperationSchema = z.object({
    type: z.literal('add_post'),
    id: z.string().describe('The ID of the post to add'),
    post: postContentSchema.describe('The post to add'),
})

/**
 * Operation to remove posts by their IDs
 */
export const removePostOperationSchema = z.object({
    type: z.literal('remove_post'),
    id: z.string().describe('The ID of the post to remove'),
});

/**
 * Type exports
 */
export type AddPostOperation = z.infer<typeof addPostOperationSchema>;
export type RemovePostOperation = z.infer<typeof removePostOperationSchema>;

/**
 * Diff registry entry with metadata
 */
export type DiffRegistry = Array<AddPostOperation | RemovePostOperation>;