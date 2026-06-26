import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBrandKit,
    extractBrandingFromWebsite,
    saveBrandKit,
} from '@/actions/brand-kit';
import { toast } from '@/hooks/use-toast';

/**
 * Query hook to fetch brand kit
 */
export function useBrandKit() {
    return useQuery({
        queryKey: ['brandKit'],
        queryFn: async () => {
            const result = await getBrandKit();
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

/**
 * Mutation hook to extract branding from website
 */
export function useExtractBranding() {
    return useMutation({
        mutationFn: async (url: string) => {
            const result = await extractBrandingFromWebsite(url);
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to extract branding',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Mutation hook to save/update brand kit
 */
export function useSaveBrandKit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            primaryColor?: string;
            additionalColors?: unknown;
            font?: string;
            logo?: string;
            icon?: string;
        }) => {
            const result = await saveBrandKit(data);
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brandKit'] });
            toast({
                description: 'Brand kit saved successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to save brand kit',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
