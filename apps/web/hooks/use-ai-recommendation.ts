'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAIRecommendations } from '@/actions/tools/ai-recommendation';
import { useIntegratedAccounts } from '@/contexts/integration-context';

// Helper hook to get platforms with fallback
const usePlatforms = () => {
    const {
        data: integratedPlatforms,
        isLoading,
        isError,
    } = useIntegratedAccounts();

    // Use integrated platforms, or fallback to empty array
    if (
        isLoading ||
        isError ||
        !integratedPlatforms ||
        integratedPlatforms.length === 0
    ) {
        return [];
    }

    return integratedPlatforms;
};

// Hook for recommendations with manual triggering
export const useAIRecommendations = (enabled = false) => {
    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: ['ai-recommendations'],
        queryFn: () => fetchAIRecommendations(availablePlatforms),
        enabled: enabled && availablePlatforms.length > 0,
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};
