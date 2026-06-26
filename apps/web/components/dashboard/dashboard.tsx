'use client';

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { endOfDay, startOfDay, subDays } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from './date-range-picker';
import { PlatformAnalytics } from './platform-analytics';
import type { DateRange } from 'react-day-picker';
import { useCurrentUser } from '@/hooks/use-current-user';
import { redirect } from 'next/navigation';
import { useIntegratedAccounts } from '@/contexts/integration-context';
import { DEFAULT_LOGOUT_REDIRECT } from '@/routes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const user = useCurrentUser();

    if (!user) {
        redirect(DEFAULT_LOGOUT_REDIRECT);
    }

    const timezone = user.timeZone;

    // Convert default date range to user's timezone
    const defaultDateRange: DateRange = {
        from: subDays(startOfDay(new Date()), 30),
        to: endOfDay(new Date()),
    };

    const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);

    const { data: integratedPlatforms, isLoading: isLoadingAccounts } =
        useIntegratedAccounts();

    // Check if there are any integrated accounts
    const hasIntegratedAccounts =
        !isLoadingAccounts &&
        integratedPlatforms &&
        integratedPlatforms.length > 0;

    if (isLoadingAccounts) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-sm">Loading integrated accounts...</p>
            </div>
        );
    }

    if (
        (!hasIntegratedAccounts && !isLoadingAccounts) ||
        !integratedPlatforms
    ) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12" />
                <h1 className="mt-4 text-2xl font-bold">
                    No Social Media Accounts Connected
                </h1>
                <p className="text-sm text-muted-foreground">
                    To view analytics dashboard, you need to connect your social
                    media accounts.
                </p>
            </div>
        );
    }

    // Get available platforms
    const availablePlatforms = integratedPlatforms.map((platform) =>
        platform.provider.toLowerCase(),
    );
    const hasFacebook = availablePlatforms.includes('facebook');
    const hasLinkedin = availablePlatforms.includes('linkedin');
    const hasTwitter = availablePlatforms.includes('twitter');

    const platformIcons = {
        facebook: {
            icon: '/facebook.svg',
            className:
                'data-[state=active]:bg-[#1877F2]/10 data-[state=active]:text-[#1877F2] data-[state=active]:border-[#1877F2] hover:bg-[#1877F2]/5 hover:text-[#1877F2]',
        },
        linkedin: {
            icon: '/linkedin.svg',
            className:
                'data-[state=active]:bg-[#0A66C2]/10 data-[state=active]:text-[#0A66C2] data-[state=active]:border-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#0A66C2]',
        },
        twitter: {
            icon: '/twitter.svg',
            className:
                'data-[state=active]:bg-black/10 data-[state=active]:text-black data-[state=active]:border-black hover:bg-black/5 hover:text-black',
        },
    };

    // Determine default tab based on available platforms
    const getDefaultTab = () => {
        if (hasFacebook) return 'facebook';
        if (hasLinkedin) return 'linkedin';
        if (hasTwitter) return 'twitter';
        return 'facebook'; // fallback
    };

    return (
        <div className="relative h-full w-full">
            <Tabs
                defaultValue={getDefaultTab()}
                className="flex w-full flex-col"
            >
                <header className="z-10 flex flex-col items-start justify-between gap-2 bg-background md:flex-row md:items-center">
                    <TabsList className="h-fit w-fit p-1.5">
                        {hasFacebook && (
                            <TabsTrigger
                                value="facebook"
                                className={cn(
                                    'flex items-center gap-1.5 border border-dashed border-transparent bg-transparent py-1.5',
                                    platformIcons.facebook.className,
                                )}
                            >
                                <Image
                                    src={platformIcons.facebook.icon}
                                    alt="Facebook"
                                    className="h-4 w-4"
                                    width={16}
                                    height={16}
                                />
                                <span>Facebook</span>
                            </TabsTrigger>
                        )}
                        {hasLinkedin && (
                            <TabsTrigger
                                value="linkedin"
                                className={cn(
                                    'flex items-center gap-1.5 border border-dashed border-transparent bg-transparent py-1.5',
                                    platformIcons.linkedin.className,
                                )}
                            >
                                <Image
                                    src={platformIcons.linkedin.icon}
                                    alt="LinkedIn"
                                    className="h-4 w-4"
                                    width={16}
                                    height={16}
                                />
                                <span>LinkedIn</span>
                            </TabsTrigger>
                        )}
                        {hasTwitter && (
                            <TabsTrigger
                                value="twitter"
                                className={cn(
                                    'flex items-center gap-1.5 border border-dashed border-transparent bg-transparent py-1.5',
                                    platformIcons.twitter.className,
                                )}
                            >
                                <Image
                                    src={platformIcons.twitter.icon}
                                    alt="Twitter"
                                    className="h-4 w-4"
                                    width={16}
                                    height={16}
                                />
                                <span>Twitter</span>
                            </TabsTrigger>
                        )}
                    </TabsList>
                    <DatePickerWithRange
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        timezone={timezone}
                    />
                </header>
                <main className="mt-2 flex-1 space-y-4">
                    {hasFacebook && (
                        <TabsContent value="facebook" className="space-y-4">
                            <PlatformAnalytics
                                platform="facebook"
                                dateRange={dateRange}
                                integratedPlatforms={integratedPlatforms}
                            />
                        </TabsContent>
                    )}

                    {hasLinkedin && (
                        <TabsContent value="linkedin" className="space-y-4">
                            <PlatformAnalytics
                                platform="linkedin"
                                dateRange={dateRange}
                                integratedPlatforms={integratedPlatforms}
                            />
                        </TabsContent>
                    )}

                    {hasTwitter && (
                        <TabsContent value="twitter" className="space-y-4">
                            <PlatformAnalytics
                                platform="twitter"
                                dateRange={dateRange}
                                integratedPlatforms={integratedPlatforms}
                            />
                        </TabsContent>
                    )}
                </main>
            </Tabs>
        </div>
    );
}
