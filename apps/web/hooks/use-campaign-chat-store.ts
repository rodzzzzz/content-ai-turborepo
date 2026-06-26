import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
} from '@tanstack/react-query';
import {
    createCampaign,
    getCampaignById,
    deleteCampaign,
    updateCampaign,
    getInfiniteCampaigns,
    updateCampaignPlan,
} from '@/actions/campaign';
import { useParams, useRouter } from 'next/navigation';
import { Platform } from '@prisma/client';
import { DateRange } from 'react-day-picker';
import { CampaignType } from '@/types/campaign';
import { UIMessage } from 'ai';

export function useCampaignChatStore(campaignId?: string) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const params = useParams();
    const campaignIdFromParams = params.campaignId;
    const finalCampaignId = campaignId || campaignIdFromParams;

    const {
        data: infiniteCampaignsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingInfiniteCampaigns,
        error: infiniteCampaignsError,
    } = useInfiniteQuery({
        queryKey: ['campaigns-infinite'],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            const result = await getInfiniteCampaigns({
                limit: 12,
                cursor: pageParam,
            });
            if (result.error) throw new Error(result.error);
            return result;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const {
        data: currentCampaignData,
        isLoading: isLoadingCurrentCampaign,
        error: currentCampaignError,
    } = useQuery({
        queryKey: ['campaign', finalCampaignId],
        queryFn: async () => {
            if (!finalCampaignId) return null;
            const result = await getCampaignById(finalCampaignId as string);
            if (result.error) throw new Error(result.error);
            return result;
        },
        enabled: !!finalCampaignId,
        retry: 1,
    });

    const currentCampaign = currentCampaignData?.campaign;

    const createCampaignMutation = useMutation({
        mutationFn: async ({
            title,
            description,
            platforms,
            initialMessage,
        }: {
            title: string;
            description: string;
            platforms: Platform[];
            initialMessage: {
                message: Omit<UIMessage, 'id'>;
                platforms: Platform[];
                campaignDateRange?: DateRange;
                deepResearch: boolean;
                gatherCompanyKnowledge: boolean;
                includeBlogPosts: boolean;
            };
        }) => {
            const result = await createCampaign(
                title,
                description,
                platforms,
                initialMessage,
            );
            if (result.error || !result.campaign)
                throw new Error(result.error || 'Failed to create campaign');
            return result.campaign;
        },
        onSuccess: (result) => {
            // Invalidate infinite query to refetch
            queryClient.invalidateQueries({ queryKey: ['campaigns-infinite'] });
            // Invalidate current campaign query to refetch
            queryClient.invalidateQueries({
                queryKey: ['campaign', result.id],
            });
        },
    });

    const updateCampaignMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: { title: string; description: string };
        }) => {
            const result = await updateCampaign(id, data);
            if (result.error || !result.campaign)
                throw new Error(result.error || 'Failed to update campaign');
            return result.campaign;
        },
        onSuccess: ({ id }) => {
            queryClient.invalidateQueries({ queryKey: ['campaign', id] });
            // Invalidate infinite query to refetch
            queryClient.invalidateQueries({ queryKey: ['campaigns-infinite'] });
        },
    });

    const deleteCampaignMutation = useMutation({
        mutationFn: async (deleteCampaignId: string) => {
            const result = await deleteCampaign(deleteCampaignId);
            if (result.error) throw new Error(result.error);

            return deleteCampaignId;
        },
        onSuccess: () => {
            // Invalidate infinite query to refetch
            queryClient.invalidateQueries({ queryKey: ['campaigns-infinite'] });
        },
    });

    const updateCampaignContentMutation = useMutation({
        mutationFn: async ({
            campaignId,
            campaignPlan,
        }: {
            campaignId: string;
            campaignPlan: CampaignType;
        }) => {
            // Update the campaign plan directly in the database
            const result = await updateCampaignPlan(campaignId, campaignPlan);

            if (result.error) {
                throw new Error(result.error);
            }

            return result.campaign;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['campaign', finalCampaignId],
            });

            router.refresh();
        },
    });

    return {
        currentCampaign,
        isLoadingCampaignMessages: isLoadingCurrentCampaign,
        currentCampaignError,
        // Infinite query data
        infiniteCampaigns: infiniteCampaignsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoadingInfiniteCampaigns,
        infiniteCampaignsError,
        refetch: () => {
            if (finalCampaignId) {
                queryClient.invalidateQueries({
                    queryKey: ['campaign', finalCampaignId],
                });
            }
        },
        createCampaign: createCampaignMutation.mutateAsync,
        updateCampaign: updateCampaignMutation.mutateAsync,
        deleteCampaign: deleteCampaignMutation.mutateAsync,
        updateCampaignContent: updateCampaignContentMutation.mutateAsync,
        isCreatingCampaign: createCampaignMutation.isPending,
        isUpdatingCampaign: updateCampaignMutation.isPending,
        isDeletingCampaign: deleteCampaignMutation.isPending,
        isUpdatingCampaignContent: updateCampaignContentMutation.isPending,
    };
}
