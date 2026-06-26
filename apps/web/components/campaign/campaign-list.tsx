'use client';

import { formatInTimeZone } from 'date-fns-tz';
import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { UpdateCampaignDialog } from './update-campaign-dialog';
import { useRouter } from 'next/navigation';
import { platformImage } from '@/constants/platform-images';
import { Button } from '../ui/button';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import { Skeleton } from '../ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CampaignDeleteDialog } from './delete-campaign-dialog';

export const CampaignList = ({ timeZone }: { timeZone: string }) => {
    const router = useRouter();
    const [openUpdateCampaignDialog, setOpenUpdateCampaignDialog] =
        useState(false);
    const [updateCampaign, setUpdateCampaign] = useState<{
        id: string;
        title: string;
        description: string;
    } | null>(null);
    const [openDeleteCampaignDialog, setOpenDeleteCampaignDialog] =
        useState(false);
    const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(
        null,
    );

    const {
        infiniteCampaigns,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoadingInfiniteCampaigns,
    } = useCampaignChatStore();

    // Flatten the pages of campaigns into a single array
    const campaigns = useMemo(() => {
        if (!infiniteCampaigns?.pages) return [];
        return infiniteCampaigns.pages.flatMap((page) => page.campaigns || []);
    }, [infiniteCampaigns]);

    // Create an Intersection Observer to detect when the user scrolls to the bottom
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage],
    );

    useEffect(() => {
        const element = observerTarget.current;
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '200px', // Load earlier before user reaches bottom
            threshold: 0.1, // Trigger when element is 10% visible
        });

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleObserver]);

    return (
        <div className="w-full">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                {/* Show skeleton loading for initial load */}
                {isLoadingInfiniteCampaigns && campaigns.length === 0 ? (
                    <CampaignListSkeleton count={6} />
                ) : campaigns.length > 0 ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <h2 className="font-semibold leading-none tracking-tight">
                                Previous Campaigns
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Here are your previous campaigns.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {campaigns
                                .sort(
                                    (a, b) =>
                                        b.createdAt.getTime() -
                                        a.createdAt.getTime(),
                                )
                                .map((campaign) => (
                                    <div
                                        key={campaign.id}
                                        className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:cursor-pointer"
                                        onClick={() => {
                                            router.replace(
                                                `/campaign/${campaign.id}`,
                                            );
                                        }}
                                    >
                                        <div className="flex items-center pl-1.5">
                                            {campaign.platforms.map(
                                                (platform, index) =>
                                                    platformImage(
                                                        platform.toUpperCase() as keyof typeof platformImage,
                                                        '-ml-1.5 h-6 w-6 rounded-full border-2 border-background',
                                                        `${campaign.id}-${platform}-${index}`,
                                                    ),
                                            )}
                                        </div>

                                        <div className="flex h-full flex-col">
                                            <h3 className="text-sm font-semibold">
                                                {campaign.name}
                                            </h3>
                                            <p className="mb-4 mt-1 text-xs text-muted-foreground">
                                                {campaign.description}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between gap-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatInTimeZone(
                                                        campaign.createdAt,
                                                        timeZone,
                                                        "MMM d, yyyy 'at' hh:mm a",
                                                    )}
                                                </p>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        align="end"
                                                        side="top"
                                                        className="w-32 p-1"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUpdateCampaign(
                                                                    {
                                                                        id: campaign.id,
                                                                        title: campaign.name,
                                                                        description:
                                                                            campaign.description ||
                                                                            '',
                                                                    },
                                                                );
                                                                setOpenUpdateCampaignDialog(
                                                                    true,
                                                                );
                                                            }}
                                                            className="w-full justify-start px-2"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                            Edit
                                                        </Button>

                                                        <Button
                                                            variant="outline-destructive"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteCampaignId(
                                                                    campaign.id,
                                                                );
                                                                setOpenDeleteCampaignDialog(
                                                                    true,
                                                                );
                                                            }}
                                                            className="w-full justify-start border-none px-2 shadow-none"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                ) : null}

                {/* Show skeleton loading for next page */}
                {isFetchingNextPage && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <CampaignSkeleton key={`loading-${index}`} />
                        ))}
                    </div>
                )}

                {/* Observer target for infinite scrolling */}
                {hasNextPage && !isFetchingNextPage && (
                    <div ref={observerTarget} className="h-4" />
                )}
            </div>

            {updateCampaign && (
                <UpdateCampaignDialog
                    open={openUpdateCampaignDialog}
                    onOpenChange={setOpenUpdateCampaignDialog}
                    campaign={{
                        id: updateCampaign.id,
                        title: updateCampaign?.title || '',
                        description: updateCampaign?.description || '',
                    }}
                />
            )}
            {deleteCampaignId && (
                <CampaignDeleteDialog
                    open={openDeleteCampaignDialog}
                    onOpenChange={setOpenDeleteCampaignDialog}
                    campaignId={deleteCampaignId}
                />
            )}
        </div>
    );
};

function CampaignSkeleton() {
    return (
        <div className="flex w-full flex-col gap-2 rounded-lg border border-border p-4">
            <Skeleton className="h-6 w-16" />

            <div className="flex h-full flex-col">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-4 h-3 w-full" />
                <Skeleton className="mt-auto h-3 w-1/2" />
            </div>
        </div>
    );
}

function CampaignListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: count }).map((_, index) => (
                    <CampaignSkeleton key={index} />
                ))}
            </div>
        </>
    );
}
