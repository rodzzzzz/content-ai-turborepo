import { useQuery } from '@tanstack/react-query';
import {
    getCachedCrawlData,
    getPageExtractionVector,
} from '@/actions/website-extraction';
import { getFAQs } from '@/actions/faq';

export const useWebsiteExtractions = () => {
    return useQuery({
        queryKey: ['websiteExtractions'],
        queryFn: async () => {
            const result = await getPageExtractionVector();
            return result;
        },
    });
};

export const useCachedCrawlData = () => {
    return useQuery({
        queryKey: ['cachedCrawlData'],
        queryFn: async () => {
            const result = await getCachedCrawlData();
            return result;
        },
    });
};

export const useFAQs = () => {
    return useQuery({
        queryKey: ['faqs'],
        queryFn: async () => {
            const result = await getFAQs();
            return result;
        },
    });
};
