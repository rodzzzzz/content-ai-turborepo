'use client';

import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { toZonedTime } from 'date-fns-tz';
import {
    fetchOverviewMetrics,
    fetchFollowerGrowth,
    fetchTwitterEngagementData,
    fetchReactionsData,
    fetchLinkedinEngagementData,
} from '@/actions/dashboard';
import { fetchPlatformInsights } from '@/actions/tools/insight';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIntegratedAccounts } from '@/contexts/integration-context';

// Query keys
export const QUERY_KEYS = {
    overviewMetrics: 'overviewMetrics',
    platformInsights: 'platformInsights',
    followerGrowth: 'followerGrowth',
    engagement: 'engagement',
    reactions: 'reactions',
};

// Helper function to get default date range in user's timezone
const getDefaultDateRange = (timezone: string): DateRange => ({
    from: toZonedTime(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        timezone,
    ),
    to: toZonedTime(new Date(), timezone),
});

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

// Hook for overview metrics
export const useOverviewMetrics = (
    dateRange?: DateRange,
    platform?: 'facebook' | 'twitter' | 'linkedin',
) => {
    const user = useCurrentUser();
    const timezone = user?.timeZone || 'UTC';
    const defaultRange = getDefaultDateRange(timezone);

    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: [
            QUERY_KEYS.overviewMetrics,
            dateRange || defaultRange,
            timezone,
            platform,
        ],
        queryFn: () =>
            fetchOverviewMetrics(dateRange || defaultRange, platform),
        enabled: availablePlatforms.length > 0,
    });
};

// Hook for follower growth data
export const useFollowerGrowth = (
    dateRange?: DateRange,
    platform?: 'facebook' | 'twitter' | 'linkedin',
) => {
    const user = useCurrentUser();
    const timezone = user?.timeZone || 'UTC';
    const defaultRange = getDefaultDateRange(timezone);

    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: [
            QUERY_KEYS.followerGrowth,
            dateRange || defaultRange,
            timezone,
            platform,
        ],
        queryFn: () => fetchFollowerGrowth(dateRange || defaultRange, platform),
        enabled: availablePlatforms.length > 0,
    });
};

// Hook for Twitter engagement data
export const useTwitterEngagementData = () => {
    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: [QUERY_KEYS.engagement, 'twitter'],
        queryFn: () => fetchTwitterEngagementData(),
        enabled: availablePlatforms.length > 0,
    });
};

// Hook for Linkedin engagement data
export const useLinkedinEngagementData = () => {
    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: [QUERY_KEYS.engagement, 'linkedin'],
        queryFn: () => fetchLinkedinEngagementData(),
        enabled: availablePlatforms.length > 0,
    });
};

// Hook for reactions data
export const useReactionsData = () => {
    const availablePlatforms = usePlatforms();

    return useQuery({
        queryKey: [QUERY_KEYS.reactions],
        queryFn: () => fetchReactionsData(),
        enabled: availablePlatforms.length > 0,
    });
};

// Hook for platform insights
export const usePlatformInsights = (
    platform?: 'facebook' | 'twitter' | 'linkedin',
) => {
    const availablePlatforms = usePlatforms();
    const providerAccountId = availablePlatforms.find(
        (p) => p.provider === platform,
    )?.providerAccountId;

    return useQuery({
        queryKey: [QUERY_KEYS.platformInsights, platform],
        queryFn: () => fetchPlatformInsights(7, providerAccountId!, platform),
        enabled: availablePlatforms.length > 0,
    });
};
