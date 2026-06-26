'use client';

import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import {
    createContext,
    useContext,
    useState,
    ReactNode,
    SetStateAction,
    Dispatch,
    useEffect,
    useMemo,
} from 'react';
import { CampaignType, ContentItem } from '@/types/campaign';
import { useParams } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import {
    applyDiffToCampaignPlan,
    updateDiffRegistry,
} from '@/actions/campaign';
import { DiffRegistry } from '@/types/campaign-update';
import { addPostToCampaignPlan, removeDiffFromRegistry, removePostFromCampaignPlan } from '@/lib/campaign-diff';

interface CampaignPreviewContextType {
    campaignPlan: CampaignType | null;
    setCampaignPlan: Dispatch<SetStateAction<CampaignType | null>>;
    setIsPreview: Dispatch<SetStateAction<boolean>>;
    isPreview: boolean;
    updateContent: (contentId: string, updates: ContentItem) => Promise<void>;
    isUpdatingCampaignContent: boolean;
    pendingDiffs: DiffRegistry;
    setPendingDiffs: Dispatch<SetStateAction<DiffRegistry>>;
    approveDiff: (entryId: string) => Promise<void>;
    rejectDiff: (entryId: string) => Promise<void>;
    approveAllDiffs: () => Promise<void>;
    rejectAllDiffs: () => Promise<void>;
    pendingDiffCount: number;
}

const CampaignPreviewContext = createContext<
    CampaignPreviewContextType | undefined
>(undefined);

export function CampaignPreviewProvider({ children }: { children: ReactNode }) {
    const [campaignPlan, setCampaignPlan] =
        useState<CampaignType | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [pendingDiffs, setPendingDiffs] = useState<DiffRegistry>([]);

    const params = useParams();
    const campaignId = params.campaignId as string;

    const { currentCampaign, refetch, isUpdatingCampaignContent, updateCampaignContent } =
        useCampaignChatStore(campaignId);

    useEffect(() => {
        if (currentCampaign?.campaign) {
            setCampaignPlan(currentCampaign.campaign as CampaignType);
        }

        if (currentCampaign?.diffRegistry) {
            setPendingDiffs(currentCampaign.diffRegistry as DiffRegistry);
        }
    }, [currentCampaign?.campaign, currentCampaign?.diffRegistry]);

    const updateContent = async (contentId: string, updates: ContentItem) => {
        if (!campaignPlan || !campaignId) return;

        try {
            // Update the content in the campaign plan
            const updatedCampaign: CampaignType = {
                ...campaignPlan,
                campaign: campaignPlan.campaign.map((platformGroup) =>
                    platformGroup.contents.find((c) => c.id === contentId)
                        ? {
                            ...platformGroup,
                            contents: platformGroup.contents.map((c) =>
                                c.id === contentId ? updates : c,
                            ),
                        }
                        : platformGroup,
                ),
            };

            // Update local state of campaign plan
            setCampaignPlan(updatedCampaign);

            // Update the database directly
            await updateCampaignContent({
                campaignId: campaignId,
                campaignPlan: updatedCampaign,
            });

            // Refetch to ensure consistency
            refetch();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update content',
                variant: 'destructive',
            });
        }
    };

    // Count the number of pending diffs
    const pendingDiffCount = useMemo(() => {
        return pendingDiffs.length;
    }, [pendingDiffs]);

    const approveDiff = async (entryId: string) => {
        if (!campaignPlan || !campaignId) return;

        const registryEntry = pendingDiffs.find((e) => e.id === entryId);

        if (!registryEntry) {
            toast({
                description: 'Diff not found or already processed',
                variant: 'destructive',
            });
            return;
        }

        let updatedCampaignPlan: CampaignType = campaignPlan;

        if (registryEntry.type === 'add_post') {
            const post = { id: entryId, ...registryEntry.post } as ContentItem;
            updatedCampaignPlan = addPostToCampaignPlan(campaignPlan, post);
        } else if (registryEntry.type === 'remove_post') {
            updatedCampaignPlan = removePostFromCampaignPlan(campaignPlan, registryEntry.id);
        }

        const updatedDiffRegistry = removeDiffFromRegistry(pendingDiffs, entryId);

        // Update local state of campaign plan and pending diffs
        setCampaignPlan(updatedCampaignPlan);
        setPendingDiffs(updatedDiffRegistry);

        const result = await applyDiffToCampaignPlan(campaignId, updatedCampaignPlan, updatedDiffRegistry);

        // If there is an error, revert the local state of pending diffs and campaign plan
        if (result.error) {
            setPendingDiffs(currentCampaign?.diffRegistry as DiffRegistry);
            setCampaignPlan(currentCampaign?.campaign as CampaignType);
            toast({
                description: result.error,
                variant: 'destructive',
            });
        }

        // Refetch to ensure consistency even if successful or not
        refetch();
    };

    const rejectDiff = async (entryId: string) => {
        if (!campaignId || !campaignPlan) return;

        const registryEntry = pendingDiffs.find((e) => e.id === entryId);

        if (!registryEntry) {
            toast({
                description: 'Diff not found or already processed',
                variant: 'destructive',
            });
            return;
        }

        // Update pending diffs - remove rejected entry
        const updatedDiffRegistry = removeDiffFromRegistry(pendingDiffs, entryId);
        setPendingDiffs(updatedDiffRegistry);

        const result = await updateDiffRegistry(campaignId, updatedDiffRegistry);

        // If there is an error, revert the local state of pending diffs
        if (result.error) {
            setPendingDiffs(currentCampaign?.diffRegistry as DiffRegistry);
            toast({
                description: result.error,
                variant: 'destructive',
            });
            return;
        }

        // Refetch to ensure consistency even if successful or not
        refetch();
    };

    const approveAllDiffs = async () => {
        if (!campaignId || !campaignPlan) return;

        // Early return if no pending diffs
        if (pendingDiffs.length === 0) {
            return;
        }

        // Process all diffs in memory before updating state
        let updatedCampaignPlan: CampaignType = campaignPlan;

        for (const registryEntry of pendingDiffs) {
            if (registryEntry.type === 'add_post') {
                const post = { id: registryEntry.id, ...registryEntry.post } as ContentItem;
                updatedCampaignPlan = addPostToCampaignPlan(updatedCampaignPlan, post);
            } else if (registryEntry.type === 'remove_post') {
                updatedCampaignPlan = removePostFromCampaignPlan(updatedCampaignPlan, registryEntry.id);
            }
        }

        // All diffs approved, registry becomes empty
        const updatedDiffRegistry: DiffRegistry = [];

        // Update local state once (optimized batch update)
        setCampaignPlan(updatedCampaignPlan);
        setPendingDiffs(updatedDiffRegistry);

        const result = await applyDiffToCampaignPlan(campaignId, updatedCampaignPlan, updatedDiffRegistry);

        // If there is an error, revert the local state of pending diffs and campaign plan
        if (result.error) {
            setPendingDiffs(currentCampaign?.diffRegistry as DiffRegistry);
            setCampaignPlan(currentCampaign?.campaign as CampaignType);
            toast({
                description: result.error,
                variant: 'destructive',
            });
            return;
        }

        // Refetch to ensure consistency even if successful or not
        refetch();
    };

    const rejectAllDiffs = async () => {
        if (!campaignId || !campaignPlan) return;

        // Early return if no pending diffs
        if (pendingDiffs.length === 0) {
            return;
        }

        // All diffs rejected, registry becomes empty
        const updatedDiffRegistry: DiffRegistry = [];

        // Update local state
        setPendingDiffs(updatedDiffRegistry);

        const result = await updateDiffRegistry(campaignId, updatedDiffRegistry);

        // If there is an error, revert the local state of pending diffs
        if (result.error) {
            setPendingDiffs(currentCampaign?.diffRegistry as DiffRegistry);
            toast({
                description: result.error,
                variant: 'destructive',
            });
            return;
        }

        // Refetch to ensure consistency even if successful or not
        refetch();
    };

    return (
        <CampaignPreviewContext.Provider
            value={{
                campaignPlan,
                setCampaignPlan,
                isPreview,
                setIsPreview,
                updateContent,
                isUpdatingCampaignContent: isUpdatingCampaignContent,
                pendingDiffs,
                setPendingDiffs,
                approveDiff,
                rejectDiff,
                approveAllDiffs,
                rejectAllDiffs,
                pendingDiffCount,
            }}
        >
            {children}
        </CampaignPreviewContext.Provider>
    );
}

export function useCampaignPreview() {
    const context = useContext(CampaignPreviewContext);
    if (context === undefined) {
        throw new Error(
            'useCampaignPreview must be used within a CampaignPreviewProvider',
        );
    }
    return context;
}
