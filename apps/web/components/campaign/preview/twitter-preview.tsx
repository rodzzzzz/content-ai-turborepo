import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    MoreHorizontal,
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    BarChart3,
    InfoIcon,
} from 'lucide-react';
import { ImageGrid } from './image-grid';
import { ContentItem } from '@/types/campaign';
import { Dispatch, SetStateAction } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwitterPreviewProps {
    authorName: string;
    authorHandle: string;
    authorImage: string;
    content: ContentItem;
    isEditing?: boolean;
    editedContent?: ContentItem;
    onContentChange: Dispatch<SetStateAction<ContentItem>>;
    disabled?: boolean;
}

export function TwitterPreview({
    authorName,
    authorHandle,
    authorImage,
    content,
    isEditing = false,
    editedContent,
    onContentChange,
    disabled = false,
}: TwitterPreviewProps) {
    const initials = authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <>
            <Card className="flex w-full max-w-xl flex-col border-0 md:border">
                <div className="p-4">
                    <div className="flex gap-3">
                        {/* Avatar */}
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={authorImage} />
                            <AvatarFallback className="bg-[#1d9bf0] text-white">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            {/* Header */}
                            <div className="mb-1 flex items-start justify-between">
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="cursor-pointer text-sm font-bold">
                                        {authorName}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {`@${authorHandle}`}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        ·
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        1m
                                    </span>
                                </div>
                                <div className="-mt-1 p-1.5 text-muted-foreground">
                                    <MoreHorizontal className="h-[18px] w-[18px]" />
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="mb-3">
                                {isEditing ? (
                                    <Textarea
                                        value={editedContent?.content || ''}
                                        onChange={(e) =>
                                            onContentChange((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    content: e.target.value,
                                                };
                                            })
                                        }
                                        autoFocus
                                        placeholder="What's happening?"
                                        className="field-sizing-content min-h-[80px] resize-none rounded-none border-0 p-0 text-sm leading-5 shadow-none ring-1 ring-border ring-offset-4 focus-visible:ring-primary"
                                        disabled={disabled}
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-5">
                                        {content?.content}
                                    </p>
                                )}
                            </div>

                            {/* Images */}
                            {(() => {
                                const media = isEditing
                                    ? editedContent?.media
                                    : content?.media;

                                return media && media.length > 0;
                            })() && (
                                <div className="mb-3">
                                    <ImageGrid
                                        images={
                                            isEditing
                                                ? editedContent?.media || []
                                                : content?.media || []
                                        }
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="-ml-2 flex max-w-md items-center justify-between">
                                <div className="flex items-center gap-1 rounded-full p-2">
                                    <MessageCircle className="h-[18px] w-[18px] text-muted-foreground" />
                                    <span className="text-[13px] text-muted-foreground">
                                        48
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 rounded-full p-2">
                                    <Repeat2 className="h-[18px] w-[18px] text-muted-foreground" />
                                    <span className="text-[13px] text-muted-foreground">
                                        12
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 rounded-full p-2">
                                    <Heart className="h-[18px] w-[18px] text-muted-foreground" />
                                    <span className="text-[13px] text-muted-foreground">
                                        324
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 rounded-full p-2">
                                    <BarChart3 className="h-[18px] w-[18px] text-muted-foreground" />
                                    <span className="text-[13px] text-muted-foreground">
                                        1.2K
                                    </span>
                                </div>
                                <div className="rounded-full p-2">
                                    <Share className="h-[18px] w-[18px] text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="p-4 pt-0 md:px-0">
                <Alert className="max-w-xl" variant="destructive">
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                        We don&apos;t support scheduled posting to X at the
                        moment. You can post manually by clicking the button
                        above.
                    </AlertDescription>
                </Alert>
            </div>
        </>
    );
}
