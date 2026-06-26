import { CampaignType, ContentItem } from '@/types/campaign';
import { DiffRegistry } from '@/types/campaign-update';

export interface DiffPreview {
    adds: Array<{
        id: string;
        platform: 'facebook' | 'twitter' | 'linkedin';
        post: ContentItem;
    }>;
    removes: Array<{
        id: string;
        post: ContentItem;
    }>;
}

/**
 * Gets a structured preview of what diffs will change
 * @param campaign The original campaign
 * @param diffs Array of diff operations
 * @returns Structured preview of changes
 */
export function getDiffPreview(
    campaign: CampaignType,
    diffs: DiffRegistry,
): DiffPreview {
    const preview: DiffPreview = {
        adds: [],
        removes: [],
    };

    diffs.forEach((entry) => {
        if (entry.type === 'add_post') {
            const post = entry.post as ContentItem;
            if (post) {
                preview.adds.push({
                    id: entry.id,
                    platform: post.platform,
                    post: {
                        ...post,
                        id: entry.id,
                    },
                });
            }
        } else if (entry.type === 'remove_post') {
            // Find post to remove
            let postToRemove: ContentItem | undefined;
            for (const platformGroup of campaign.campaign) {
                const found = platformGroup.contents.find(
                    (c) => c.id === entry.id,
                );
                if (found) {
                    postToRemove = found;
                    break;
                }
            }

            if (postToRemove) {
                preview.removes.push({
                    id: entry.id,
                    post: postToRemove,
                });
            }
        }
    });

    return preview;
}

export const addPostToCampaignPlan = (campaignPlan: CampaignType, post: ContentItem): CampaignType => {
    const updatedCampaignPlan = {
        ...campaignPlan,
        campaign: campaignPlan.campaign.map((platformGroup) => {
            // Check if this platform group matches the post's platform
            if (platformGroup.platform === post.platform) {
                // Check if post already exists to avoid duplicates
                const postExists = platformGroup.contents.some((c) => c.id === post.id);
                if (!postExists) {
                    return {
                        ...platformGroup,
                        contents: [...platformGroup.contents, post].sort((a, b) => {
                            return new Date(a.dateAndTime).getTime() - new Date(b.dateAndTime).getTime();
                        }),
                    };
                }
            }
            return platformGroup;
        }),
    };
    return updatedCampaignPlan;
}

export const removePostFromCampaignPlan = (campaignPlan: CampaignType, postId: string): CampaignType => {
    const updatedCampaignPlan = {
        ...campaignPlan,
        campaign: campaignPlan.campaign.map((platformGroup) => ({
            ...platformGroup,
            contents: platformGroup.contents.filter((c) => c.id !== postId),
        })),
    };
    return updatedCampaignPlan;
}

export const removeDiffFromRegistry = (registry: DiffRegistry, diffId: string): DiffRegistry => {
    return registry.filter((diff) => diff.id !== diffId);
}