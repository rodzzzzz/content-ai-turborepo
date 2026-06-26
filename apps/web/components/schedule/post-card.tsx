import Image from 'next/image';
import {
    MoreVertical,
    CalendarClockIcon,
    SquarePenIcon,
    CircleCheckIcon,
    ImageOffIcon,
    Pencil,
    Trash,
    ArrowUpRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Platform, Schedule } from '@prisma/client';
import { format } from 'date-fns-tz';
import isUrl from 'is-url';
import { Badge } from '../ui/badge';
import { getFacebookPostUrl } from '@/lib/facebook';
import { getTwitterPostUrl } from '@/lib/twitter';
import { getLinkedInPostUrl } from '@/lib/linkedin';

const platformIcons = {
    FACEBOOK: { icon: '/facebook.svg', color: '#1877F2', label: 'Facebook' },
    INSTAGRAM: { icon: '/instagram.svg', color: '#E1306C', label: 'Instagram' },
    TWITTER: { icon: '/twitter.svg', color: '#1DA1F2', label: 'Twitter' },
    PINTEREST: { icon: '/pinterest.svg', color: '#E60023', label: 'Pinterest' },
    TIKTOK: { icon: '/tiktok.svg', color: '#000000', label: 'TikTok' },
    YOUTUBE: { icon: '/youtube.svg', color: '#FF0000', label: 'YouTube' },
    LINKEDIN: { icon: '/linkedin.svg', color: '#0077B5', label: 'LinkedIn' },
};

const statusColors = {
    DRAFT: {
        bg: 'bg-yellow-50/80',
        border: 'border-yellow-300',
        badgeBg: 'bg-yellow-100',
        text: 'text-yellow-500',
        icon: SquarePenIcon,
    },
    SCHEDULED: {
        bg: 'bg-green-50/80',
        border: 'border-green-200',
        badgeBg: 'bg-green-100',
        text: 'text-green-500',
        icon: CalendarClockIcon,
    },
    PUBLISHED: {
        bg: 'bg-blue-50/80',
        border: 'border-blue-300',
        badgeBg: 'bg-blue-100',
        text: 'text-blue-500',
        icon: CircleCheckIcon,
    },
};

type PostCardProps = {
    post: Schedule;
    onDelete: (id: string) => void;
    onEdit: (post: Schedule) => void;
    isOnPast: boolean;
    timeZone: string;
};

const getPostUrl = (platform: Platform, postId: string | null) => {
    if (!postId) return '';

    switch (platform) {
        case 'FACEBOOK':
            return getFacebookPostUrl(postId);
        case 'LINKEDIN':
            return getLinkedInPostUrl(postId);
        case 'TWITTER':
            return getTwitterPostUrl(postId);
        default:
            return '';
    }
};

export function PostCard({
    post,
    onDelete,
    onEdit,
    isOnPast,
    timeZone,
}: PostCardProps) {
    const StatusIcon = statusColors[post.status]?.icon;

    return (
        <div
            className={cn(
                'flex flex-col gap-2 rounded-md border p-2 text-xs shadow-sm',
                statusColors[post.status].bg,
                statusColors[post.status].border,
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    {/* <Icon className="w-3 h-3 text-muted-foreground" /> */}
                    <div
                        className={cn(
                            'inline-flex items-center space-x-1 rounded p-1',
                            statusColors[post.status].badgeBg,
                            statusColors[post.status].text,
                        )}
                    >
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs capitalize">
                            {post.status.toLowerCase()}
                        </span>
                    </div>
                </div>
                {(!isOnPast || post.status === 'DRAFT') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(post)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(post.id)}
                            >
                                <Trash className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {post.status === 'PUBLISHED' && post.postId && (
                    <Button
                        variant="link"
                        size="icon"
                        className="h-fit w-fit gap-0 p-1 text-[10px]"
                        onClick={() => {
                            window.open(
                                getPostUrl(post.platform, post.postId),
                                '_blank',
                            );
                        }}
                    >
                        View Post <ArrowUpRightIcon className="h-3 w-3" />
                    </Button>
                )}
            </div>
            <div className="flex flex-col gap-1">
                {post.mediaUrl.length > 0 && (
                    <div
                        className={cn(
                            'relative flex h-[100px] w-full items-center justify-center overflow-hidden rounded',
                            statusColors[post.status].badgeBg,
                        )}
                    >
                        {isUrl(post.mediaUrl[0]) ? (
                            <Image
                                src={post.mediaUrl[0]}
                                alt={post.mediaUrl[0]}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <ImageOffIcon className="h-4 w-4" />
                        )}
                        {post.mediaUrl.length > 1 && (
                            <Badge className="absolute right-2 top-2 px-1.5 text-[10px]">
                                + {post.mediaUrl.length - 1} more
                            </Badge>
                        )}
                    </div>
                )}
                <p className="line-clamp-2 whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative h-5 w-5 overflow-hidden rounded-full">
                    <Image
                        src={
                            platformIcons[
                                post.platform as keyof typeof platformIcons
                            ].icon || '/placeholder.svg'
                        }
                        alt={
                            platformIcons[
                                post.platform as keyof typeof platformIcons
                            ]?.label || 'Platform'
                        }
                        fill
                        className="object-contain"
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    {format(post.date, 'h:mm a', {
                        timeZone,
                    })}
                </p>
            </div>
        </div>
    );
}
