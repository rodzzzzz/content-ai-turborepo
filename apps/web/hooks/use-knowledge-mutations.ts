import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    crawlWebsite,
    extractContent,
    deleteExtractedLink,
    updateExtractedContent,
} from '@/actions/website-extraction';
import { toast } from '@/hooks/use-toast';
import { saveFAQs, deleteFAQs } from '@/actions/faq';
import { FAQFormValues } from '@/lib/validations/faq';
import { updateUserSetup } from '@/actions/setup';

export function useCrawlWebsite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            url,
            mode,
        }: {
            url: string;
            mode: 'exact' | 'path' | 'domain';
        }) => {
            const result = await crawlWebsite(url, mode);
            return result;
        },
        onSuccess: (result) => {
            if (result.data.length === 1) {
                return;
            }

            queryClient.invalidateQueries({ queryKey: ['cachedCrawlData'] });

            toast({
                description: 'Website crawled successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useExtractContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (urls: string[]) => {
            const result = await extractContent(urls);

            await updateUserSetup('companyInfo');

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['websiteExtractions'] });
            toast({
                description: 'Content extracted successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useDeleteExtractedLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (linkIds: string[]) => {
            const result = await deleteExtractedLink(linkIds);

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete links');
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['websiteExtractions'] });
            toast({
                description: 'Links deleted successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useUpdateExtractedContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            linkId,
            title,
            content,
            url,
        }: {
            linkId: string;
            title: string;
            content: string;
            url: string;
        }) => {
            const result = await updateExtractedContent(
                linkId,
                title,
                content,
                url,
            );
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['websiteExtractions'] });
            toast({
                description: 'Content updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Something went wrong',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export const useSaveFAQs = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, faq }: { id: string; faq: FAQFormValues }) => {
            const result = await saveFAQs(id, faq);
            if (!result.success) {
                throw new Error(result.error || 'Failed to save FAQs');
            }

            await updateUserSetup('companyInfo');

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
    });
};

export const useDeleteFAQs = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (faqId: string) => {
            const result = await deleteFAQs(faqId);
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete FAQs');
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
    });
};
