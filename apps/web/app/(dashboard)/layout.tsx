'use client';

import { AppSidebar } from '@/components/nav/app-sidebar';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { AIRecommendations } from '@/components/ai-recommendation';
import { Separator } from '@/components/ui/separator';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { CampaignHeader } from '@/components/campaign/campaign-header';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowUpCircleIcon } from 'lucide-react';
import { useSubscription } from '@/contexts/subscription-context';
import { ExpirationBanner } from '@/components/integration/expiration-banner';
import { TrialExpirationBanner } from '@/components/subscription/trial-expiration-banner';

export default function DashboradLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    //Get the current pathname
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const navName = pathname.split('/').pop() || 'Dashboard';

    const isCampaignChat =
        pathname.startsWith('/campaign') && params.campaignId;

    const { isTrial } = useSubscription();

    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />

            <SidebarInset>
                <TrialExpirationBanner />
                <ExpirationBanner />
                <ScrollArea isFullHeight className="h-full">
                    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 overflow-visible rounded-t-xl bg-clip-padding backdrop-blur-xl backdrop-filter">
                        <div className="flex w-full items-center gap-2 pl-4 pr-4">
                            {isCampaignChat ? (
                                <CampaignHeader />
                            ) : (
                                <>
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator
                                        orientation="vertical"
                                        className="h-4"
                                    />
                                    <p className="text-sm capitalize">
                                        {navName}
                                    </p>
                                </>
                            )}

                            <div
                                className={cn(
                                    'ml-auto flex items-center gap-2',
                                    isCampaignChat ? 'hidden md:flex' : '',
                                )}
                            >
                                {isTrial && (
                                    <Button
                                        className="hidden md:flex"
                                        variant="outline"
                                        onClick={() =>
                                            router.push('/subscription')
                                        }
                                    >
                                        Upgrade
                                        <ArrowUpCircleIcon className="h-4 w-4" />
                                    </Button>
                                )}
                                <AIRecommendations />
                            </div>
                        </div>
                    </header>

                    {children}
                </ScrollArea>
            </SidebarInset>
        </SidebarProvider>
    );
}
