'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { CardContent } from '@/components/ui/card';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTwitterEngagementData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TwitterEngagementChartProps {
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
}

const mockData = [
    { name: 'Facebook', likes: 100, comments: 50, shares: 25 },
    { name: 'Instagram', likes: 100, comments: 50, shares: 25 },
    { name: 'Twitter', likes: 100, comments: 50, shares: 25 },
];

export function TwitterEngagementChart({
    className,
}: TwitterEngagementChartProps) {
    // Fetch data using our custom hook
    const { data, isLoading, isError } = useTwitterEngagementData();

    const isEmpty = data?.isEmpty || !data?.data || data.data.length === 0;
    const chartData = isEmpty ? mockData : data.data!;

    const chartConfig = {
        favorites: {
            label: 'Favorites',
            color: 'hsl(var(--chart-1))',
        },
        replies: {
            label: 'Replies',
            color: 'hsl(var(--chart-2))',
        },
        retweets: {
            label: 'Retweets',
            color: 'hsl(var(--chart-3))',
        },
    };

    const renderContent = () => {
        // Handle error state
        if (isError || data?.isError) {
            return (
                <div className="flex h-[250px] w-full items-center justify-center">
                    <Alert variant="destructive" className="w-full max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {data?.error || 'Failed to load engagement data'}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        // Handle loading state
        if (isLoading) {
            return (
                <div className="flex h-[250px] w-full items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                </div>
            );
        }

        // Render chart with data
        return (
            <>
                {isEmpty && (
                    <div className="absolute -inset-y-1 inset-x-0 z-10 flex h-full items-center justify-center bg-opacity-20 bg-clip-padding px-6 pb-6 backdrop-blur-sm backdrop-filter">
                        <Alert className="w-fit" variant="primary">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>No Data Available</AlertTitle>
                            <AlertDescription>
                                There&apos;s not enough data to show.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar
                            dataKey="favorites"
                            fill="var(--color-favorites)"
                            radius={4}
                            isAnimationActive={!isEmpty}
                        />
                        <Bar
                            dataKey="replies"
                            fill="var(--color-replies)"
                            radius={4}
                            isAnimationActive={!isEmpty}
                        />
                        <Bar
                            dataKey="retweets"
                            fill="var(--color-retweets)"
                            radius={4}
                            isAnimationActive={!isEmpty}
                        />
                    </BarChart>
                </ChartContainer>
            </>
        );
    };

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>
                    Favorites, replies, and retweets from the last 7 days
                </CardDescription>
            </CardHeader>
            <CardContent className="relative">{renderContent()}</CardContent>
        </Card>
    );
}
