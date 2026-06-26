import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Eye, Users, AlertCircle, Ban } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useOverviewMetrics } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OverviewMetricsProps {
    dateRange: DateRange;
    platform?: 'facebook' | 'twitter' | 'linkedin';
}

export function OverviewMetrics({ dateRange, platform }: OverviewMetricsProps) {
    // Fetch data using our custom hook
    const { data, isLoading, isError } = useOverviewMetrics(
        dateRange,
        platform,
    );

    // Check for error state
    if (isError || data?.isError) {
        return (
            <div className="col-span-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {data?.error || 'Failed to load metrics data'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Check for empty state
    if (data?.isEmpty) {
        return (
            <div className="col-span-4">
                <Alert className="py-8">
                    <Ban className="h-4 w-4" />
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>
                        No analytics data available for the selected criteria.
                        Try different platforms or date range.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    let platformSpecificTitle = 'Reach';

    switch (platform) {
        case 'twitter':
            platformSpecificTitle = 'Total Views';
            break;
        case 'linkedin':
            platformSpecificTitle = 'Total Impressions';
            break;
        default:
            platformSpecificTitle = 'Reach';
            break;
    }

    // Define the metrics configuration with icons
    const metricConfig = [
        {
            id: 'followers',
            title: 'Followers',
            icon: Users,
        },
        {
            id: 'engagement',
            title: 'Engagement Rate',
            icon: Activity,
        },
        {
            id: 'reach',
            title: platformSpecificTitle,
            icon: Eye,
        },
    ];

    return (
        <>
            {metricConfig.map((config) => (
                <Card key={config.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {config.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 rounded bg-primary p-1 text-primary-foreground">
                            <config.icon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="mb-1 h-8 w-20" />
                                <Skeleton className="h-4 w-32" />
                            </>
                        ) : (
                            data?.data && (
                                <>
                                    <div className="text-2xl font-bold">
                                        {
                                            data.data[
                                                config.id as keyof typeof data.data
                                            ].value
                                        }
                                    </div>
                                    <p
                                        className={cn(
                                            'text-xs',
                                            data.data[
                                                config.id as keyof typeof data.data
                                            ].positive
                                                ? 'text-green-600'
                                                : 'text-red-600',
                                        )}
                                    >
                                        {
                                            data.data[
                                                config.id as keyof typeof data.data
                                            ].change
                                        }{' '}
                                        from previous period
                                    </p>
                                </>
                            )
                        )}
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
