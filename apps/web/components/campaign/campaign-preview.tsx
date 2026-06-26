import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCampaignPreview } from '@/contexts/campaign-preview-context';
import { CampaignType, ContentItem } from '@/types/campaign';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { platformImage } from '@/constants/platform-images';
import {
    ClockIcon,
    EyeIcon,
    LayoutListIcon,
    PencilIcon,
    TextSelectIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isEmpty } from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import { ContentPreview } from './preview/content-preview';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { AnimatePresence, motion } from 'framer-motion';
import { TwitterManualPost } from './twitter-manual-post';
import { SchedulePostPopover } from './schedule-post-popover';
import {
    DiffActions,
    DiffWrapper,
} from './diff-indicators';
import {
    getDiffPreview,
} from '@/lib/campaign-diff';

const colorScheme = {
    facebook: {
        text: 'text-[#1877F2]',
        border: 'border-[#1877F2]/20',
        background: 'bg-[#1877F2]',
        badge: 'bg-[#1877F2]/5 text-[#1877F2] border-[#1877F2]/20',
    },
    twitter: {
        text: 'text-black',
        border: 'border-black/20',
        background: 'bg-black',
        badge: 'bg-black/5 text-black border-black/20',
    },
    linkedin: {
        text: 'text-[#0A66C2]',
        border: 'border-[#0A66C2]/20',
        background: 'bg-[#0A66C2]',
        badge: 'bg-[#0A66C2]/5 text-[#0A66C2] border-[#0A66C2]/20',
    },
    blog: {
        text: 'text-orange-500',
        border: 'border-orange-500/20',
        background: 'bg-orange-500',
        badge: 'bg-orange-500/5 text-orange-500 border-orange-500/20',
    },
    default: {
        text: 'text-foreground',
        border: 'border-border',
        background: 'bg-background',
        badge: 'bg-background',
    },
};

const getStatusElement = (
    status: Pick<
        CampaignType,
        'campaign'
    >['campaign'][number]['contents'][number]['status'],
) => {
    switch (status) {
        case 'empty':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 px-1.5 mt-2 text-xs text-muted-foreground"
                >
                    No content created
                </Badge>
            );
        case 'scheduled':
            return (
                <Badge variant="positive" className="gap-1 px-1.5 mt-2 text-xs">
                    Scheduled
                </Badge>
            );
        case 'created':
        default:
            return null;
    }
};

export const CampaignPreview = () => {
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
        null,
    );
    const [isEditing, setIsEditing] = useState(false);
    const {
        campaignPlan,
        isUpdatingCampaignContent,
        pendingDiffCount,
        approveAllDiffs,
        rejectAllDiffs,
    } = useCampaignPreview();

    useEffect(() => {
        // Move to campaign preview list if selected content is not in the campaign
        if (
            !campaignPlan?.campaign.find((campaign) =>
                campaign.contents.find(
                    (content) => content.id === selectedContent?.id,
                ),
            )
        ) {
            setSelectedContent(null);
            setIsEditing(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignPlan]);

    return (
        <div className="border-border h-full w-full rounded-lg border">
            <Tabs
                defaultValue="campaign"
                value={selectedContent ? 'content' : 'campaign'}
                onValueChange={(value) => {
                    if (value === 'campaign') {
                        setSelectedContent(null);
                        setIsEditing(false);
                    }
                }}
                className="flex h-full flex-col"
            >
                <div className="flex items-center justify-between gap-2 border-b border-border p-2 pr-3">
                    <TabsList className="border border-border p-0">
                        <Tooltip>
                            <TabsTrigger
                                value="campaign"
                                className="p-2.5"
                                disabled={isUpdatingCampaignContent}
                                asChild
                            >
                                <TooltipTrigger>
                                    <LayoutListIcon className="h-4 w-4" />
                                </TooltipTrigger>
                            </TabsTrigger>
                            <TooltipContent>Campaign</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TabsTrigger
                                value="content"
                                className="p-2.5"
                                disabled={
                                    !selectedContent ||
                                    isUpdatingCampaignContent
                                }
                                asChild
                            >
                                <TooltipTrigger>
                                    <EyeIcon className="h-4 w-4" />
                                </TooltipTrigger>
                            </TabsTrigger>
                            <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                    </TabsList>

                    {pendingDiffCount > 0 && selectedContent === null && (
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge variant="secondary" className="h-8 px-2 text-xs font-bold font-mono text-muted-foreground border border-border border-dashed">
                                        {pendingDiffCount}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    {pendingDiffCount} pending change{pendingDiffCount !== 1 ? 's' : ''}
                                </TooltipContent>
                            </Tooltip>
                            <Button
                                variant="outline"
                                size="sm"
                                className='border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-600'
                                onClick={async () => {
                                    await rejectAllDiffs();
                                }}
                            >
                                Reject All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className='border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-600'
                                onClick={async () => {
                                    await approveAllDiffs();
                                }}
                            >
                                Approve All
                            </Button>

                        </div>
                    )}

                    {selectedContent && selectedContent.content && (
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <Toggle
                                    size="sm"
                                    variant="outline"
                                    pressed={isEditing}
                                    onPressedChange={setIsEditing}
                                    className="gap-0 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-500 data-[state=on]:shadow-blue-100"
                                    disabled={isUpdatingCampaignContent}
                                    asChild
                                >
                                    <TooltipTrigger>
                                        <PencilIcon className="h-4 w-4" />
                                        <AnimatePresence initial={false}>
                                            {isEditing && (
                                                <motion.div
                                                    className="shrink-0 overflow-clip text-ellipsis"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: 'auto' }}
                                                    exit={{ width: 0 }}
                                                >
                                                    <p className="ml-2 whitespace-nowrap text-xs">
                                                        Edit Mode
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </TooltipTrigger>
                                </Toggle>
                                <TooltipContent>
                                    Toggle Edit Mode
                                </TooltipContent>
                            </Tooltip>
                            {selectedContent.platform === 'twitter' ? (
                                <TwitterManualPost
                                    content={selectedContent.content}
                                />
                            ) : (
                                <SchedulePostPopover
                                    content={selectedContent}
                                    setContent={setSelectedContent}
                                >
                                    <Button
                                        size="sm"
                                        disabled={
                                            isEditing ||
                                            isUpdatingCampaignContent
                                        }
                                    >
                                        Schedule Post
                                    </Button>
                                </SchedulePostPopover>
                            )}
                        </div>
                    )}
                </div>

                <TabsContent
                    value="campaign"
                    className="mt-0 h-full overflow-y-auto p-4 pt-6"
                >
                    <CampaignPreviewList
                        setSelectedContent={setSelectedContent}
                    />
                </TabsContent>

                <TabsContent
                    value="content"
                    className="relative mt-0 flex flex-col overflow-hidden p-0"
                >
                    {selectedContent && (
                        <ContentPreview
                            content={selectedContent}
                            setContent={setSelectedContent}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper component to display post content
const PostContentDisplay = ({
    content,
    color,
    onClick,
}: {
    content: ContentItem;
    color: typeof colorScheme[keyof typeof colorScheme];
    onClick: () => void;
}) => {
    return (
        <div
            className="flex w-full flex-col items-start gap-1 text-left text-sm hover:cursor-pointer"
            onClick={onClick}
        >
            <div className="relative flex w-full items-center justify-between gap-1">
                <Badge
                    variant="secondary"
                    className={cn(
                        'relative h-fit w-fit items-center gap-1 px-1.5',
                        color.badge,
                    )}
                >
                    <ClockIcon className="h-3 w-3" />
                    {format(
                        new Date(content.dateAndTime),
                        "MMM dd, yyyy 'at' hh:mm a",
                    )}
                </Badge>
                {content.contentCategory && (
                    <Badge variant="secondary" className={cn(
                        'relative mr-auto h-fit w-fit items-center gap-1 px-1.5 capitalize',
                        color.badge,
                    )}>
                        {content.contentCategory}
                    </Badge>
                )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">
                {content.contentIdea}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {content.marketingAngle}
            </p>
            {getStatusElement(content.status)}
        </div>
    );
};

const CampaignPreviewList = ({
    setSelectedContent,
}: {
    setSelectedContent: (content: ContentItem) => void;
}) => {
    const {
        campaignPlan,
        pendingDiffs,
        approveDiff,
        rejectDiff,
    } = useCampaignPreview();


    // Get diff preview for organizing diffs
    const diffPreview = useMemo(() => {
        if (!campaignPlan || pendingDiffs.length === 0) {
            return null;
        }
        return getDiffPreview(campaignPlan, pendingDiffs);
    }, [campaignPlan, pendingDiffs]);

    // Create a map of post IDs to their diff info
    const postDiffMap = useMemo(() => {
        const map = new Map<
            string,
            {
                diffIndex: number;
                type: 'add_post' | 'remove_post';
            }
        >();

        pendingDiffs.forEach((entry, diffIndex) => {
            map.set(entry.id, {
                diffIndex,
                type: entry.type,
            });
        });

        return map;
    }, [pendingDiffs]);

    if (isEmpty(campaignPlan?.campaign)) {
        // Show pending adds even if campaign is empty
        if (diffPreview && diffPreview.adds.length > 0) {
            return (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-lg font-semibold leading-tight">
                                Pending Changes
                            </h4>
                            <p className="max-w-lg text-sm text-muted-foreground">
                                Review and approve the suggested changes below.
                            </p>
                        </div>
                    </div>
                    {diffPreview.adds.map((add) => {
                        const diffInfo = postDiffMap.get(add.id);
                        if (!diffInfo) return null;

                        const color =
                            colorScheme[
                            add.platform.toLowerCase() as keyof typeof colorScheme
                            ] || colorScheme.default;

                        return (
                            <div
                                key={add.id}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    {platformImage(
                                        add.platform.toUpperCase() as keyof typeof platformImage,
                                    )}
                                    <h3
                                        className={cn(
                                            'font-semibold capitalize',
                                            color.text,
                                        )}
                                    >
                                        {add.platform}
                                    </h3>
                                </div>
                                <DiffWrapper
                                    entry={pendingDiffs[diffInfo.diffIndex]}
                                >
                                    <div className="p-2">
                                        <DiffActions
                                            entryId={add.id}
                                            type="add_post"
                                            onApprove={approveDiff}
                                            onReject={rejectDiff}
                                        />
                                        <PostContentDisplay
                                            content={add.post}
                                            color={color}
                                            onClick={() => setSelectedContent(add.post)}
                                        />
                                    </div>
                                </DiffWrapper>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-background/20 p-4 text-center backdrop-blur">
                <div className="rounded-2xl bg-primary p-2 text-primary-foreground shadow-lg">
                    <TextSelectIcon className="h-16 w-16 stroke-[1.5]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                    No campaign created yet
                </h3>
                <p className="text-sm text-muted-foreground">
                    Created campaigns will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h4 className="text-lg font-semibold leading-tight">
                        {campaignPlan?.campaignTitle}
                    </h4>
                    <p className="max-w-lg text-sm text-muted-foreground">
                        {campaignPlan?.campaignDescription}
                    </p>
                </div>

            </div>

            <div className="flex flex-col gap-6">
                {campaignPlan?.campaign.map((campaignItem, index) => {
                    const color =
                        colorScheme[
                        campaignItem.platform.toLowerCase() as keyof typeof colorScheme
                        ] || colorScheme.default;

                    // Get pending adds for this platform
                    const platformAdds = diffPreview?.adds.filter(
                        (add) => add.platform === campaignItem.platform,
                    ) || [];

                    // Get all contents including pending adds
                    const allContents: ContentItem[] = [
                        ...campaignItem.contents,
                        ...platformAdds.map((add) => add.post as ContentItem),
                    ].sort((a, b) => {
                        return (
                            new Date(a.dateAndTime).getTime() -
                            new Date(b.dateAndTime).getTime()
                        );
                    });

                    return (
                        <div
                            key={`${campaignItem.platform}-${index}`}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-2">
                                {platformImage(
                                    campaignItem.platform.toUpperCase() as keyof typeof platformImage,
                                )}
                                <h3
                                    className={cn(
                                        'font-semibold capitalize',
                                        color.text,
                                    )}
                                >
                                    {campaignItem.platform}
                                </h3>
                            </div>
                            <div className="flex h-fit">
                                <div className="flex flex-1 gap-2.5 pl-1.5">
                                    <div className="h-[calc(100%-0.5rem)] w-[1px] bg-border" />
                                    <div className="flex w-full flex-col gap-4">
                                        {allContents.map((content) => {
                                            const diffInfo = postDiffMap.get(content.id);
                                            const isDeleted = diffInfo?.type === 'remove_post';
                                            const isNew = diffInfo?.type === 'add_post';

                                            const hasPendingChanges = isDeleted || isNew;

                                            const contentElement = (
                                                <div
                                                    key={`${content.id}`}
                                                    className={cn(
                                                        'flex w-full flex-col items-start gap-1 rounded-md p-2 text-left text-sm',
                                                        !hasPendingChanges && 'hover:cursor-pointer hover:bg-muted',
                                                    )}
                                                    onClick={() =>
                                                        !hasPendingChanges && setSelectedContent(content)
                                                    }
                                                >
                                                    <div className="relative flex w-full items-center justify-between gap-1">
                                                        <div
                                                            className={cn(
                                                                'absolute -left-5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full',
                                                                color.background,
                                                            )}
                                                        />

                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                'relative h-fit w-fit items-center gap-1 px-1.5',
                                                                color.badge,
                                                            )}
                                                        >
                                                            <ClockIcon className="h-3 w-3" />
                                                            {format(
                                                                new Date(
                                                                    content.dateAndTime,
                                                                ),
                                                                "MMM dd, yyyy 'at' hh:mm a",
                                                            )}
                                                        </Badge>
                                                        {content.contentCategory && (
                                                            <Badge variant="secondary" className={cn(
                                                                'relative mr-auto h-fit w-fit items-center gap-1 px-1.5 capitalize',
                                                                color.badge,
                                                            )}>
                                                                {content.contentCategory}
                                                            </Badge>
                                                        )}
                                                        {diffInfo && (
                                                            <DiffActions
                                                                entryId={content.id}
                                                                type={diffInfo.type}
                                                                onApprove={approveDiff}
                                                                onReject={rejectDiff}
                                                                className="absolute right-0 -top-full"
                                                            />

                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        'mt-2 whitespace-pre-wrap text-sm',
                                                        isDeleted && 'line-through'
                                                    )}>
                                                        {content.contentIdea}
                                                    </p>
                                                    <p className={cn(
                                                        'mt-1 text-xs text-muted-foreground',
                                                        isDeleted && 'line-through'
                                                    )}>
                                                        {content.marketingAngle}
                                                    </p>

                                                    {!hasPendingChanges && getStatusElement(
                                                        content.status,
                                                    )}
                                                </div>
                                            );

                                            if (hasPendingChanges) {
                                                return (
                                                    <DiffWrapper
                                                        key={content.id}
                                                        entry={pendingDiffs[diffInfo.diffIndex]}
                                                    >
                                                        {contentElement}
                                                    </DiffWrapper>
                                                );
                                            }

                                            return contentElement;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Show adds for platforms that don't exist yet */}
                {diffPreview?.adds
                    .filter((add) => {
                        return !campaignPlan?.campaign.some(
                            (pg) => pg.platform === add.platform,
                        );
                    })
                    .map((add) => {
                        const diffInfo = postDiffMap.get(add.id);
                        if (!diffInfo) return null;

                        const color =
                            colorScheme[
                            add.platform.toLowerCase() as keyof typeof colorScheme
                            ] || colorScheme.default;

                        return (
                            <div
                                key={add.id}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    {platformImage(
                                        add.platform.toUpperCase() as keyof typeof platformImage,
                                    )}
                                    <h3
                                        className={cn(
                                            'font-semibold capitalize',
                                            color.text,
                                        )}
                                    >
                                        {add.platform}
                                    </h3>
                                </div>
                                <DiffWrapper
                                    entry={pendingDiffs[diffInfo.diffIndex]}
                                >
                                    <div className="p-2">
                                        <DiffActions
                                            entryId={add.id}
                                            type="add_post"
                                            onApprove={approveDiff}
                                            onReject={rejectDiff}
                                        />
                                        <PostContentDisplay
                                            content={add.post as ContentItem}
                                            color={color}
                                            onClick={() => setSelectedContent(add.post as ContentItem)}
                                        />
                                    </div>
                                </DiffWrapper>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
