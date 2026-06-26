import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export const CampaignHeader = () => {
    const { currentCampaign, isLoadingCampaignMessages } =
        useCampaignChatStore();

    return (
        <div className="flex w-full items-center gap-2">
            <Link href="/campaign">
                <Button variant="secondary" size="icon">
                    <ArrowLeftIcon className="h-4 w-4" />
                </Button>
            </Link>
            {isLoadingCampaignMessages ? (
                <div className="flex flex-1 flex-col gap-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ) : (
                <div className="flex w-full flex-1 flex-col pr-14 md:pr-0">
                    <h3 className="w-full truncate text-sm font-medium">
                        {currentCampaign?.name}
                    </h3>
                    <p className="w-full max-w-[30ch] truncate text-xs text-muted-foreground">
                        {currentCampaign?.description}
                    </p>
                </div>
            )}
        </div>
    );
};
