import {
    InfoIcon,
    AlertCircle,
    HeartIcon,
    Repeat2Icon,
    EyeIcon,
    MessageSquareIcon,
    VideoIcon,
    ImageIcon,
    LinkIcon,
    ImagesIcon,
    PartyPopperIcon,
    ChartColumnBigIcon,
    GalleryHorizontalEndIcon,
    NewspaperIcon,
    MousePointerClickIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePlatformInsights } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Image from 'next/image';
import {
    PlatformInsight,
    TwitterPostType,
    FacebookPostType,
    LinkedInPostType,
} from '@/actions/tools/insight';
import { isEmpty } from 'lodash';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { cn, kFormatter } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { getLinkedInPostUrl } from '@/lib/linkedin';
import { getFacebookPostUrl } from '@/lib/facebook';
import { getTwitterPostUrl } from '@/lib/twitter';

const mockData = [
    {
        platform: 'twitter',
        growth: '+100',
        engagement: '+50',
        bestTime: ['10 AM', '8 PM'],
        topContent: ['Post 1', 'Post 2'],
        topPosts: [],
        confidence: 82,
    },
    {
        platform: 'facebook',
        growth: '+100',
        engagement: '+50',
        bestTime: ['10 AM', '8 PM'],
        topContent: ['Post 1', 'Post 2'],
        topPosts: [],
        confidence: 91,
    },
    {
        platform: 'linkedin',
        growth: '+100',
        engagement: '+50',
        bestTime: ['10 AM', '8 PM'],
        topContent: ['Post 1', 'Post 2'],
        topPosts: [],
        confidence: 91,
    },
];

interface PlatformInsightsProps {
    platform?: 'facebook' | 'twitter' | 'linkedin';
    onChat?: boolean;
}

export function PlatformInsights({
    platform,
    onChat = true,
}: PlatformInsightsProps = {}) {
    // Fetch data using our custom hook
    const { data, isLoading, isError } = usePlatformInsights(platform);

    const isEmpty = data?.isEmpty || !data?.data;
    const platformInsightsData = isEmpty ? mockData[0] : data.data!;

    if (isError || data?.isError) {
        return (
            <div className="flex h-full items-center justify-center">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load platform insights</AlertTitle>
                    <AlertDescription>Please try again later.</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="relative flex h-full flex-col gap-4">
                {/* Platform Insights Card Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <div className="flex flex-wrap gap-1">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <div className="flex flex-wrap gap-1">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-muted p-4">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                    </CardContent>
                </Card>

                {/* Top Posts Card Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="mb-2 space-y-2 rounded-lg border p-3"
                                >
                                    <Skeleton className="h-16 w-full" />
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="ml-auto h-5 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative flex h-full flex-col gap-4">
            {/* Platform Insights Card */}
            <PlatformInsightsCard
                key={platformInsightsData.platform}
                insight={platformInsightsData}
                isEmptyInsights={isEmpty}
                onChat={onChat}
            />

            {/* Top Posts Section - Separate Group */}
            {platformInsightsData.topPosts &&
                platformInsightsData.topPosts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Posts</CardTitle>
                            <CardDescription>
                                The top performing posts from the past 7 days.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopPosts
                                posts={platformInsightsData.topPosts}
                                platform={
                                    platformInsightsData.platform as
                                        | 'twitter'
                                        | 'facebook'
                                        | 'linkedin'
                                }
                            />
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}

export function PlatformInsightsCard({
    insight,
    isEmptyInsights,
    className,
    onChat = true,
    ...props
}: {
    insight: Omit<PlatformInsight, 'allPosts'>;
    isEmptyInsights: boolean;
    onChat?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
    // Map platform names to their respective icons
    const platformIcons = {
        twitter: '/twitter.svg',
        facebook: '/facebook.svg',
        linkedin: '/linkedin.svg',
        instagram: '/instagram.svg',
    };

    const PlatformIcon =
        platformIcons[insight.platform as keyof typeof platformIcons];

    const invalidMessages = ['Not enough data', 'No content posted', 'N/A'];

    const invalidBestTime = invalidMessages.some((msg) =>
        insight.bestTime.includes(msg),
    );
    const invalidTopContent = invalidMessages.some((msg) =>
        insight.topContent.includes(msg),
    );
    return (
        <Card className={className} {...props}>
            <CardContent className="relative pt-6">
                {isEmptyInsights && (
                    <div className="absolute inset-0 z-10 flex h-full items-center justify-center rounded-lg bg-opacity-20 bg-clip-padding backdrop-blur-sm backdrop-filter">
                        <Alert className="w-fit" variant="primary">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>No Data Available</AlertTitle>
                            <AlertDescription>
                                There&apos;s not enough data to show.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                <div className="mb-4 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Image
                            src={PlatformIcon}
                            alt={insight.platform}
                            className={cn('h-5 w-5', onChat && 'h-4 w-4')}
                            width={20}
                            height={20}
                        />
                        <h3
                            className={cn(
                                'font-medium capitalize',
                                onChat && 'text-sm',
                            )}
                        >{`${insight.platform} Posts Insights`}</h3>
                    </div>
                    <Badge
                        variant={
                            insight.confidence > 50 ? 'positive' : 'negative'
                        }
                        className="ml-auto"
                    >
                        {insight.confidence}% confidence
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Best Posting Times
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {!isEmpty(insight.bestTime) ? (
                                insight.bestTime.map((time) => (
                                    <Badge
                                        key={time}
                                        variant={
                                            invalidBestTime
                                                ? 'secondary'
                                                : 'positive'
                                        }
                                    >
                                        {time}
                                    </Badge>
                                ))
                            ) : (
                                <Badge variant="secondary">N/A</Badge>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Top Performing Content
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {!isEmpty(insight.topContent) ? (
                                insight.topContent.map((content) => (
                                    <Badge
                                        key={content}
                                        variant={
                                            invalidTopContent
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        className="capitalize"
                                    >
                                        {content}
                                    </Badge>
                                ))
                            ) : (
                                <Badge variant="secondary">N/A</Badge>
                            )}
                        </div>
                    </div>
                </div>

                {!onChat && (
                    <div className="mt-6 flex items-center gap-2 rounded-md bg-muted p-4 text-muted-foreground">
                        <InfoIcon className="h-4 w-4 flex-shrink-0" />
                        <p className="text-xs">
                            Posts insights are based on your post engagement
                            metrics from the past 7 days.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TopPosts({
    posts,
    platform,
}: {
    posts: PlatformInsight['topPosts'];
    platform: 'twitter' | 'facebook' | 'linkedin';
}) {
    const mediaTypeIcon = {
        video: <VideoIcon className="h-3 w-3" />,
        image: <ImageIcon className="h-3 w-3" />,
        'multiple images': <ImagesIcon className="h-3 w-3" />,
        celebration: <PartyPopperIcon className="h-3 w-3" />,
        'linkedin article': <NewspaperIcon className="h-3 w-3" />,
        poll: <ChartColumnBigIcon className="h-3 w-3" />,
        carousel: <GalleryHorizontalEndIcon className="h-3 w-3" />,
        album: <ImagesIcon className="h-3 w-3" />,
        link: <LinkIcon className="h-3 w-3" />,
        default: <InfoIcon className="h-3 w-3" />,
    };

    return (
        <ScrollArea className="flex h-full max-h-[408px] flex-col">
            {posts.map((post) => {
                if (platform === 'twitter') {
                    // Twitter post
                    const twitterPost = post as TwitterPostType;
                    return (
                        <div
                            key={twitterPost.postId}
                            className="mb-2 cursor-pointer space-y-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            onClick={() =>
                                window.open(
                                    getTwitterPostUrl(twitterPost.postId),
                                    '_blank',
                                    'noopener,noreferrer',
                                )
                            }
                        >
                            <div className="flex flex-col-reverse gap-2 md:flex-row">
                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    {twitterPost.content ? (
                                        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                                            {twitterPost.content}
                                        </p>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="italic text-muted-foreground"
                                        >
                                            No Caption
                                        </Badge>
                                    )}

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {twitterPost.createdAt}
                                    </p>
                                </div>

                                {twitterPost.mediaType !== 'none' && (
                                    <Badge
                                        variant="secondary"
                                        className="h-fit w-fit items-center gap-1 text-xs capitalize"
                                    >
                                        {mediaTypeIcon[
                                            twitterPost.mediaType.toLowerCase() as keyof typeof mediaTypeIcon
                                        ] || mediaTypeIcon.default}
                                        {twitterPost.mediaType}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <HeartIcon className="h-3 w-3 fill-red-400 stroke-red-800" />
                                    {kFormatter(twitterPost.favorites)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Repeat2Icon className="h-4 w-4 stroke-yellow-400 stroke-2" />
                                    {kFormatter(twitterPost.retweets)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageSquareIcon className="h-3 w-3 fill-blue-400 stroke-blue-600" />
                                    {kFormatter(twitterPost.replies)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <EyeIcon className="h-4 w-4 fill-green-200 stroke-green-500" />
                                    {kFormatter(twitterPost.views)}
                                </div>
                                <Badge
                                    variant="positive"
                                    className="ml-auto hidden md:flex"
                                >
                                    {twitterPost.engagementRate?.toFixed(1) ||
                                        '0.0'}
                                    % engagement
                                </Badge>
                            </div>
                        </div>
                    );
                } else if (platform === 'facebook') {
                    // Facebook post
                    const facebookPost = post as FacebookPostType;
                    return (
                        <div
                            key={facebookPost.postId}
                            className="mb-2 cursor-pointer space-y-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            onClick={() => {
                                // Try to construct Facebook post URL from postId
                                const postUrl = getFacebookPostUrl(
                                    facebookPost.postId,
                                );
                                window.open(
                                    postUrl,
                                    '_blank',
                                    'noopener,noreferrer',
                                );
                            }}
                        >
                            <div className="flex flex-col-reverse gap-2 md:flex-row">
                                <div className="flex flex-1 gap-2">
                                    {/* Thumbnail Image */}
                                    {facebookPost.thumbnailUrl && (
                                        <div className="flex-shrink-0">
                                            <Image
                                                src={facebookPost.thumbnailUrl}
                                                alt="Post thumbnail"
                                                width={60}
                                                height={60}
                                                className="rounded-md object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        {facebookPost.content ? (
                                            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                                                {facebookPost.content}
                                            </p>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="w-fit italic text-muted-foreground"
                                            >
                                                No Caption
                                            </Badge>
                                        )}

                                        <p className="mt-auto text-xs text-muted-foreground">
                                            {facebookPost.createdAt}
                                        </p>
                                    </div>
                                </div>

                                {facebookPost.mediaType !== 'none' && (
                                    <Badge
                                        variant="secondary"
                                        className="h-fit w-fit items-center gap-1 text-xs capitalize"
                                    >
                                        {mediaTypeIcon[
                                            facebookPost.mediaType.toLowerCase() as keyof typeof mediaTypeIcon
                                        ] || mediaTypeIcon.default}
                                        {facebookPost.mediaType}
                                    </Badge>
                                )}
                            </div>

                            {/* Engagement Metrics */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                {/* Detailed Reactions Breakdown (if any reactions exist) */}
                                {facebookPost.reactions &&
                                    Object.values(facebookPost.reactions).some(
                                        (val) => val > 0,
                                    ) && (
                                        <div className="flex items-center gap-2">
                                            {facebookPost.reactions.like >
                                                0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>👍</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .like,
                                                    )}
                                                </span>
                                            )}
                                            {facebookPost.reactions.love >
                                                0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>❤️</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .love,
                                                    )}
                                                </span>
                                            )}
                                            {facebookPost.reactions.wow > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>😮</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .wow,
                                                    )}
                                                </span>
                                            )}
                                            {facebookPost.reactions.haha >
                                                0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>😂</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .haha,
                                                    )}
                                                </span>
                                            )}
                                            {facebookPost.reactions.sorry >
                                                0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>😢</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .sorry,
                                                    )}
                                                </span>
                                            )}
                                            {facebookPost.reactions.anger >
                                                0 && (
                                                <span className="flex items-center gap-1">
                                                    <p>😡</p>
                                                    {kFormatter(
                                                        facebookPost.reactions
                                                            .anger,
                                                    )}
                                                </span>
                                            )}
                                            <Separator
                                                orientation="vertical"
                                                className="h-4"
                                            />
                                        </div>
                                    )}
                                {/* Comments */}
                                <div className="flex items-center gap-1">
                                    <MessageSquareIcon className="h-3 w-3 fill-blue-400 stroke-blue-600" />
                                    {kFormatter(facebookPost.comments)}
                                </div>

                                {/* Shares */}
                                <div className="flex items-center gap-1">
                                    <Repeat2Icon className="h-4 w-4 stroke-yellow-400 stroke-2" />
                                    {kFormatter(facebookPost.shares)}
                                </div>

                                {/* Impressions */}
                                <div className="flex items-center gap-1">
                                    <EyeIcon className="h-4 w-4 fill-green-200 stroke-green-500" />
                                    {kFormatter(facebookPost.impressions)}
                                </div>

                                {/* Engagement Rate */}
                                <Badge
                                    variant="positive"
                                    className="ml-auto hidden md:flex"
                                >
                                    {facebookPost.engagementRate?.toFixed(1) ||
                                        '0.0'}
                                    % engagement
                                </Badge>
                            </div>
                        </div>
                    );
                } else if (platform === 'linkedin') {
                    // LinkedIn post
                    const linkedinPost = post as LinkedInPostType;

                    return (
                        <div
                            key={linkedinPost.postId}
                            className="mb-2 cursor-pointer space-y-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            onClick={() => {
                                // Try to construct LinkedIn post URL from postId
                                const postUrl = getLinkedInPostUrl(
                                    linkedinPost.postId,
                                );
                                window.open(
                                    postUrl,
                                    '_blank',
                                    'noopener,noreferrer',
                                );
                            }}
                        >
                            <div className="flex flex-col-reverse gap-2 md:flex-row">
                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    {linkedinPost.content ? (
                                        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                                            {linkedinPost.content}
                                        </p>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="italic text-muted-foreground"
                                        >
                                            No Caption
                                        </Badge>
                                    )}

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {linkedinPost.createdAt}
                                    </p>
                                </div>

                                {linkedinPost.mediaType && (
                                    <Badge
                                        variant="secondary"
                                        className="h-fit w-fit items-center gap-1 text-xs"
                                    >
                                        {mediaTypeIcon[
                                            linkedinPost.mediaType.toLowerCase() as keyof typeof mediaTypeIcon
                                        ] || mediaTypeIcon.default}
                                        {linkedinPost.mediaType}
                                    </Badge>
                                )}
                            </div>

                            {/* Engagement Metrics */}
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                {/* LinkedIn-specific metrics */}
                                <div
                                    className="flex items-center gap-1"
                                    title="Clicks"
                                >
                                    <MousePointerClickIcon className="h-3 w-3 fill-purple-400 stroke-purple-600" />
                                    {kFormatter(linkedinPost.clicks)}
                                </div>
                                <div
                                    className="flex items-center gap-1"
                                    title="Reactions"
                                >
                                    <HeartIcon className="h-3 w-3 fill-red-400 stroke-red-800" />
                                    {kFormatter(linkedinPost.likes)}
                                </div>
                                <div
                                    className="flex items-center gap-1"
                                    title="Comments"
                                >
                                    <MessageSquareIcon className="h-3 w-3 fill-blue-400 stroke-blue-600" />
                                    {kFormatter(linkedinPost.comments)}
                                </div>
                                <div
                                    className="flex items-center gap-1"
                                    title="Shares"
                                >
                                    <Repeat2Icon className="h-4 w-4 stroke-yellow-400 stroke-2" />
                                    {kFormatter(linkedinPost.shares)}
                                </div>
                                <div
                                    className="flex items-center gap-1"
                                    title="Impressions"
                                >
                                    <EyeIcon className="h-4 w-4 fill-green-200 stroke-green-500" />
                                    {kFormatter(linkedinPost.impressions)}
                                </div>

                                {/* Engagement Rate */}
                                <Badge
                                    variant="positive"
                                    className="ml-auto hidden md:flex"
                                >
                                    {linkedinPost.engagementRate?.toFixed(1) ||
                                        '0.0'}
                                    % engagement
                                </Badge>
                            </div>
                        </div>
                    );
                }
            })}
        </ScrollArea>
    );
}
