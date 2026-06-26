import z from 'zod';

export type ContentItem = {
    id: string;
    status: 'empty' | 'created' | 'error' | 'scheduled';
    platform: 'facebook' | 'twitter' | 'linkedin';
    type: 'post';
    contentCategory: 'educational' | 'storytelling' | 'authority-building';
    dateAndTime: string;
    contentIdea: string;
    marketingAngle: string;
    contentCopyPrompt: string;
    mediaCreationPrompt: string;
    content: string;
    mediaSuggestion: string;
    media?: string[];
};

export type CampaignType = {
    id: string;
    status: 'success' | 'error';
    changesSummary: string;
    campaignTitle: string;
    campaignDescription: string;
    campaign: {
        contents: ContentItem[];
        platform: 'facebook' | 'twitter' | 'linkedin';
    }[];
};

/**
 * Base schema for post content (without id, status, platform)
 */
export const postContentSchema = z.object({
    type: z.enum(['post'])
        // TODO: Add support for additional content types
        // .enum([
        //     'post',
        //     'carousel',
        //     'thread',
        //     'short-form-video',
        // ])
        .describe('The type of content to create'),
    dateAndTime: z
        .string()
        .describe(
            'Date and time of the post. Must be in the future relative to the current date. No past dates.',
        ),
    contentCategory: z
        .enum(['educational', 'storytelling', 'authority-building'])
        .describe(
            'The content category for the post: educational, storytelling, or authority-building.',
        ),
    contentIdea: z
        .string()
        .describe(
            "A concise, actionable, distinctive description of the post's content idea—the core message and direction.",
        ),
    contentCopyPrompt: z
        .string()
        .describe(
            'An optimized, highly detailed prompt for the content copy generation model to generate the full content copy, including all required brand/audience/context details, tailored to the campaign\'s nuances.',
        ),
    mediaSuggestion: z
        .string()
        .describe(
            'A media suggestion that supports the post\'s content and campaign. This is a vivid description of the media.',
        ),
    mediaCreationPrompt: z
        .string()
        .describe(
            'A comprehensive, tailored prompt for the media generation model to generate media that supports the post\'s content and campaign.',
        ),
    marketingAngle: z
        .string()
        .describe(
            'A strategic, campaign-linked approach—original, insightful, and directly tied to campaign goals and audience.',
        ),
});

export const campignPlanSchema = z.array(
    z.object({
        platform: z
            .enum(['twitter', 'linkedin', 'facebook'])
            .describe('The platform to use for the campaign'),
        contents: z.array(postContentSchema),
    }),
);
