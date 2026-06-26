'use client';

import { OverviewMetrics } from './overview-metrics';
import { FollowerGrowthChart } from './follower-growth-chart';
import { TwitterEngagementChart } from './twitter-engagement-chart';
import { LinkedinEngagementChart } from './linkedin-engagement-chart';
import { PlatformInsights } from './platform-insights';
import type { DateRange } from 'react-day-picker';
import { ReactionChart } from './reaction-chart';
import { IntegratedAccount } from '@/types/integration';

interface PlatformAnalyticsProps {
    platform: 'facebook' | 'twitter' | 'linkedin';
    dateRange: DateRange;
    integratedPlatforms: IntegratedAccount[];
}

export function PlatformAnalytics({
    platform,
    dateRange,
    integratedPlatforms,
}: PlatformAnalyticsProps) {
    // Filter platforms to only show the current platform
    const platformData = integratedPlatforms.filter(
        (p) => p.provider.toLowerCase() === platform,
    );

    if (platformData.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg font-medium">
                        No {platform} account connected
                    </p>
                    <p className="text-sm">
                        Connect your {platform} account to view analytics
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Overview Metrics for this platform */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <OverviewMetrics dateRange={dateRange} platform={platform} />
            </div>

            {/* Charts and Insights */}
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex flex-1 flex-col gap-4">
                    <FollowerGrowthChart
                        platforms={[platform]}
                        dateRange={dateRange}
                        platform={platform}
                    />
                    {platform === 'twitter' && <TwitterEngagementChart />}
                    {platform === 'facebook' && <ReactionChart />}
                    {platform === 'linkedin' && <LinkedinEngagementChart />}
                </div>

                <div className="h-full flex-1">
                    <PlatformInsights platform={platform} />
                </div>
            </div>
        </div>
    );
}
