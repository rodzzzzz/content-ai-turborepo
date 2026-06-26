'use client';

import { CampaignChat } from '@/components/campaign/campaign-chat';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import { motion, Variants } from 'framer-motion';
import { PanelRightOpenIcon, SquareChartGanttIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CampaignPreview } from '@/components/campaign/campaign-preview';
import {
    CampaignPreviewProvider,
    useCampaignPreview,
} from '@/contexts/campaign-preview-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignChatPage() {
    const sidebar = useSidebar();
    const params = useParams();
    const campaignId = params.campaignId as string;
    // const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        sidebar.setOpen(false);
        // setIsInitialized(true);
    }, [sidebar]);

    // if (!isInitialized || isLoadingCampaignMessages) {
    //     return (
    //         <div className="flex h-full w-full items-center justify-center">
    //             <LoadingCampaign />
    //         </div>
    //     );
    // }

    return (
        <CampaignPreviewProvider>
            <CampaignChatWrapper campaignId={campaignId} />
        </CampaignPreviewProvider>
    );
}

function CampaignChatWrapper({ campaignId }: { campaignId: string }) {
    const { isPreview, setIsPreview } = useCampaignPreview();
    const { isLoadingCampaignMessages } = useCampaignChatStore(campaignId);

    return (
        <>
            <div className="h-[calc(100vh-4rem)] w-screen overflow-hidden md:h-[calc(100vh-5rem-2px)] md:w-full">
                <div
                    className={cn(
                        'relative flex h-full w-fit transition-transform duration-300 md:w-full md:translate-x-0',
                        isPreview ? '-translate-x-1/2' : 'translate-x-0',
                    )}
                >
                    <div className="h-full w-screen p-4 pt-0 md:w-1/2 md:pr-2">
                        {isLoadingCampaignMessages ? (
                            <LoadingCampaignMessages />
                        ) : (
                            <div className="flex h-full flex-col gap-4">
                                <CampaignChat campaignId={campaignId} />
                            </div>
                        )}
                    </div>

                    <div className="h-full w-screen p-4 pt-0 md:w-1/2 md:pl-2">
                        {isLoadingCampaignMessages ? (
                            <motion.div
                                className="h-full w-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Skeleton className="h-full w-full" />
                            </motion.div>
                        ) : (
                            <CampaignPreview />
                        )}
                    </div>
                </div>
            </div>
            <Button
                variant="outline"
                size="icon"
                className="fixed right-4 top-4 z-50 md:hidden"
                onClick={() => setIsPreview(!isPreview)}
            >
                {isPreview ? (
                    <SquareChartGanttIcon className="h-4 w-4" />
                ) : (
                    <PanelRightOpenIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle Content</span>
            </Button>
        </>
    );
}

const LoadingCampaignMessages = () => {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const skeletonVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'linear',
            },
        },
    };

    return (
        <motion.div
            className="flex h-full w-full flex-col gap-4 p-2 md:px-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* User message skeleton */}
            <motion.div
                className="flex justify-end"
                variants={skeletonVariants}
            >
                <Skeleton className="h-32 w-4/5" />
            </motion.div>

            {/* Assistant message skeleton */}
            <motion.div variants={skeletonVariants}>
                <Skeleton className="mt-4 h-4 w-1/2" />
            </motion.div>
            <motion.div variants={skeletonVariants}>
                <Skeleton className="h-4 w-1/3" />
            </motion.div>
            <motion.div variants={skeletonVariants}>
                <Skeleton className="h-16 w-1/2" />
            </motion.div>

            {/* User message skeleton */}
            <motion.div
                className="flex justify-end"
                variants={skeletonVariants}
            >
                <Skeleton className="mt-4 h-16 w-3/5" />
            </motion.div>

            {/* Assistant message skeleton */}

            <motion.div variants={skeletonVariants}>
                <Skeleton className="h-4 w-1/3" />
            </motion.div>
            <motion.div variants={skeletonVariants}>
                <Skeleton className="h-16 w-1/2 self-start" />
            </motion.div>
        </motion.div>
    );
};
