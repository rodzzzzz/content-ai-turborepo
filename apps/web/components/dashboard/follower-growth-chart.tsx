'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { DateRange } from 'react-day-picker';
import { useFollowerGrowth } from '@/hooks/use-dashboard-data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface FollowerGrowthChartProps {
    platforms: string[];
    dateRange: DateRange;
    platform?: 'facebook' | 'twitter' | 'linkedin';
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
}

const mockData = [
    {
        date: '2024-01-01',
        twitter: 100,
        facebook: 50,
        instagram: 25,
        linkedin: 15,
    },
    {
        date: '2024-01-02',
        twitter: 105,
        facebook: 52,
        instagram: 26,
        linkedin: 16,
    },
    {
        date: '2024-01-03',
        twitter: 110,
        facebook: 54,
        instagram: 27,
        linkedin: 17,
    },
    {
        date: '2024-01-04',
        twitter: 115,
        facebook: 56,
        instagram: 28,
        linkedin: 18,
    },
    {
        date: '2024-01-05',
        twitter: 120,
        facebook: 58,
        instagram: 29,
        linkedin: 19,
    },
    {
        date: '2024-01-06',
        twitter: 125,
        facebook: 60,
        instagram: 30,
        linkedin: 20,
    },
    {
        date: '2024-01-07',
        twitter: 130,
        facebook: 62,
        instagram: 31,
        linkedin: 21,
    },
    {
        date: '2024-01-08',
        twitter: 135,
        facebook: 64,
        instagram: 32,
        linkedin: 22,
    },
    {
        date: '2024-01-09',
        twitter: 140,
        facebook: 66,
        instagram: 33,
        linkedin: 23,
    },
];

export function FollowerGrowthChart({
    platforms = [],
    dateRange,
    platform,
    className,
}: FollowerGrowthChartProps) {
    // Fetch data using our custom hook
    const { data, isLoading, isError } = useFollowerGrowth(dateRange, platform);

    const isEmpty = data?.isEmpty || !data?.data || data.data.length === 0;
    const chartData = isEmpty ? mockData : data.data!;

    // Configure the chart based on the selected platforms
    const chartConfig = {
        twitter: {
            label: 'Twitter',
            color: 'hsl(var(--chart-1))',
        },
        facebook: {
            label: 'Facebook',
            color: 'hsl(var(--chart-2))',
        },
        instagram: {
            label: 'Instagram',
            color: 'hsl(var(--chart-3))',
        },
        linkedin: {
            label: 'LinkedIn',
            color: 'hsl(var(--chart-4))',
        },
    };

    const formatDate = (date: string | Date) => {
        const parsedDate = typeof date === 'string' ? new Date(date) : date;
        return format(parsedDate, 'MMM d');
    };

    const renderContent = () => {
        // Handle error state
        if (isError || data?.isError) {
            return (
                <div className="flex h-[350px] w-full items-center justify-center">
                    <Alert variant="destructive" className="w-full max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {data?.error ||
                                'Failed to load follower growth data'}
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
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient
                                id="fillTwitter"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-twitter)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-twitter)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillFacebook"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-facebook)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-facebook)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillInstagram"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-instagram)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-instagram)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillLinkedIn"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-linkedin)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-linkedin)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={formatDate}
                                    indicator="dot"
                                />
                            }
                        />
                        {platforms.includes('twitter') && (
                            <Area
                                dataKey="twitter"
                                type="natural"
                                fill="url(#fillTwitter)"
                                stroke="var(--color-twitter)"
                                stackId="a"
                                isAnimationActive={!isEmpty}
                            />
                        )}
                        {platforms.includes('facebook') && (
                            <Area
                                dataKey="facebook"
                                type="natural"
                                fill="url(#fillFacebook)"
                                stroke="var(--color-facebook)"
                                stackId="a"
                                isAnimationActive={!isEmpty}
                            />
                        )}
                        {platforms.includes('instagram') && (
                            <Area
                                dataKey="instagram"
                                type="natural"
                                fill="url(#fillInstagram)"
                                stroke="var(--color-instagram)"
                                stackId="a"
                                isAnimationActive={!isEmpty}
                            />
                        )}
                        {platforms.includes('linkedin') && (
                            <Area
                                dataKey="linkedin"
                                type="natural"
                                fill="url(#fillLinkedIn)"
                                stroke="var(--color-linkedin)"
                                stackId="a"
                                isAnimationActive={!isEmpty}
                            />
                        )}
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </>
        );
    };

    return (
        <Card className={cn('col-span-3', className)}>
            <CardHeader>
                <CardTitle>Follower Growth</CardTitle>
                <CardDescription>
                    {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, 'MMM d, yyyy')} to ${format(
                              dateRange.to,
                              'MMM d, yyyy',
                          )}`
                        : 'Last 30 days'}
                </CardDescription>
            </CardHeader>
            <CardContent className="relative">{renderContent()}</CardContent>
        </Card>
    );
}
