'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { openai } from '@ai-sdk/openai';
import { generateObject, UIMessage } from 'ai';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { InputJsonValue, JsonValue } from '@prisma/client/runtime/library';
import { Platform } from '@prisma/client';
import { DateRange } from 'react-day-picker';
import { CampaignType, ContentItem } from '@/types/campaign';
import { AddPostOperation, DiffRegistry, RemovePostOperation } from '@/types/campaign-update';

export async function getMostRecentUserCampaignMessage(
    messages: Array<UIMessage>,
) {
    const userMessages = messages.filter((message) => message.role === 'user');
    return userMessages.at(-1);
}

export async function generateCampaignTitleAndDescription(message: string) {
    const {
        object: { title, description },
    } = await generateObject({
        model: openai('gpt-4o'),
        system: `You are a helpful assistant that generates a short social media campaign title and description based on the user's message.
      - you will generate a short title and description based on the user's message that will help the user easily identify the campaign
      - ensure it is not more than 80 characters long for the title and 150 characters for the description
      - the description should be a longer description of the campaign
      - do not use quotes or colons`,
        prompt: `Based on the following user message, generate a short title and description for a social media campaign that will help the user easily identify the campaign: ${message}`,
        schema: z.object({
            title: z.string().describe('The short title for the campaign'),
            description: z
                .string()
                .describe('The longer description for the campaign'),
        }),
    });

    return { title, description };
}

export async function createCampaign(
    title: string,
    description: string,
    platforms: Platform[],
    initialMessage: {
        message: Omit<UIMessage, 'id'>;
        platforms: Platform[];
        campaignDateRange?: DateRange;
        deepResearch: boolean;
        gatherCompanyKnowledge: boolean;
        includeBlogPosts: boolean;
    },
) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const campaign = await db.campaign.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId!,
                name: title,
                description: description,
                platforms: platforms,
                initialMessage: initialMessage as unknown as InputJsonValue,
            },
        });

        revalidatePath('/campaign');
        return { success: 'Campaign created successfully', campaign };
    } catch (error) {
        return { error: 'Failed to create campaign' };
    }
}

export async function updateCampaign(
    id: string,
    data: { title: string; description: string },
) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const campaign = await db.campaign.update({
            where: {
                id,
                userId: user.id,
            },
            data: {
                name: data.title,
                description: data.description,
            },
        });

        revalidatePath('/campaign');

        return { success: 'Campaign updated successfully', campaign };
    } catch (error) {
        return { error: 'Failed to update campaign' };
    }
}

export async function saveCampaignMessage(
    campaignId: string,
    message: UIMessage,
) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const campaignMessage = await db.campaignMessage.upsert({
            where: {
                campaignId,
                id: message.id,
            },
            update: {
                role: message.role,
                parts: (message.parts as JsonValue) || [],
            },
            create: {
                campaignId,
                role: message.role,
                parts: (message.parts as JsonValue) || [],
            },
        });

        return {
            success: 'Campaign message saved successfully',
            campaignMessage,
        };
    } catch (error) {
        return {
            error: 'Failed to save campaign message',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getCampaigns() {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const campaigns = await db.campaign.findMany({
            where: {
                userId: user.id,
                organizationId: user.organizationId!,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return { success: 'Campaigns fetched successfully', campaigns };
    } catch (error) {
        return { error: 'Failed to get chats' };
    }
}

export async function getInfiniteCampaigns(params?: {
    limit?: number;
    cursor?: string;
}) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            return { error: 'Unauthorized' };
        }

        const { limit = 12, cursor } = params || {};

        const where: any = {
            userId: user.id,
            organizationId: user.organizationId!,
        };

        // If cursor is provided, add the filter for pagination
        if (cursor) {
            where.id = {
                lt: cursor, // Less than the cursor (for getting older items)
            };
        }

        // Fetch one more item than requested to check if there are more items
        const campaigns = await db.campaign.findMany({
            where,
            take: limit + 1,
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc', // Newest first
            },
        });

        // Check if there are more items
        const hasNextPage = campaigns.length > limit;
        // Remove the extra item we fetched
        const paginatedCampaigns = hasNextPage
            ? campaigns.slice(0, limit)
            : campaigns;

        // Get the next cursor
        const nextCursor = hasNextPage
            ? paginatedCampaigns[paginatedCampaigns.length - 1].id
            : undefined;

        return {
            success: 'Campaigns fetched successfully',
            campaigns: paginatedCampaigns,
            hasNextPage,
            nextCursor,
        };
    } catch (error) {
        return { error: 'Failed to get campaigns' };
    }
}

export async function getCampaignById(campaignId: string) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const campaign = await db.campaign.findUnique({
            where: {
                id: campaignId,
                userId: user.id,
                organizationId: user.organizationId!,
            },
            include: {
                messages: {
                    orderBy: {
                        updatedAt: 'asc',
                    },
                },
            },
        });

        if (!campaign) {
            return { error: 'Campaign not found' };
        }

        return {
            success: 'Campaign fetched successfully',
            campaign,
        };
    } catch (error) {
        return { error: 'Failed to get campaign' };
    }
}

export async function deleteCampaign(campaignId: string) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        await db.campaign.delete({
            where: {
                id: campaignId,
                userId: user.id,
            },
        });

        revalidatePath('/campaign');
        return { success: 'Campaign deleted successfully' };
    } catch (error) {
        return { error: 'Failed to delete campaign' };
    }
}

export async function updateCampaignPlan(
    campaignId: string,
    campaignPlan: CampaignType,
) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        // Verify campaign ownership
        const existingCampaign = await db.campaign.findUnique({
            where: {
                id: campaignId,
                userId: user.id,
                organizationId: user.organizationId!,
            },
        });

        if (!existingCampaign) {
            return { error: 'Campaign not found or unauthorized' };
        }

        // Update the campaign plan in the database
        const updatedCampaign = await db.campaign.update({
            where: {
                id: campaignId,
                userId: user.id,
            },
            data: {
                campaign: campaignPlan as unknown as InputJsonValue,
            },
        });

        revalidatePath('/campaign');
        revalidatePath(`/campaign/${campaignId}`);

        return {
            success: 'Campaign plan updated successfully',
            campaign: updatedCampaign,
        };
    } catch (error) {
        return {
            error: 'Failed to update campaign plan',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function applyDiffToCampaignPlan(
    campaignId: string,
    campaignPlan: CampaignType,
    diffRegistry: DiffRegistry,
) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        // Verify campaign ownership
        const existingCampaign = await db.campaign.findUnique({
            where: {
                id: campaignId,
                userId: user.id,
                organizationId: user.organizationId!,
            },
        });

        if (!existingCampaign) {
            return { error: 'Campaign not found or unauthorized' };
        }

        // Update the campaign plan in the database
        const updatedCampaign = await db.campaign.update({
            where: {
                id: campaignId,
                userId: user.id,
            },
            data: {
                campaign: campaignPlan,
                diffRegistry: diffRegistry,
            },
        });

        revalidatePath('/campaign');
        revalidatePath(`/campaign/${campaignId}`);

        return {
            success: 'Diff applied to campaign plan successfully',
            campaign: updatedCampaign,
        };
    } catch (error) {
        return {
            error: 'Failed to apply diff to campaign plan',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function updateDiffRegistry(campaignId: string, diffRegistry: DiffRegistry) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        // Update the diff registry in the database
        const updatedDiffRegistry = await db.campaign.update({
            where: {
                id: campaignId,
                userId: user.id,
            },
            data: {
                diffRegistry: diffRegistry,
            },
        });

        return {
            success: 'Diff registry updated successfully',
            diffRegistry: updatedDiffRegistry,
        };
    } catch (error) {
        return {
            error: 'Failed to update diff registry',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}